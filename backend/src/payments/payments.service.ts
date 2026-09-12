import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { getSupabaseAdmin } from '../config/supabase';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { signQrPayload } from './qr-sign.util';
import { LicensesService } from '../licenses/licenses.service';
import { LicenseMailService } from '../licenses/mail.service';
import { SmsService } from '../notify/sms.service';
import { invalidateDashboardCache } from '../dashboard/dashboard.service';

function round2(n: number): number {
  return Math.round(Number(n) * 100) / 100;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly licenses: LicensesService,
    private readonly licenseMail: LicenseMailService,
    private readonly sms: SmsService,
  ) {}

  private get supabase() {
    return getSupabaseAdmin();
  }

  // ---------- Config referidos ----------
  private async getReferralConfig() {
    try {
      const { data } = await this.supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['referral_discount_percent', 'referral_commission_percent']);
      const map: Record<string, string> = {};
      for (const r of ((data as any[]) ?? [])) map[r.key] = r.value;
      return {
        discount: Number(map['referral_discount_percent'] ?? 10),
        commission: Number(map['referral_commission_percent'] ?? 10),
      };
    } catch {
      return { discount: 10, commission: 10 };
    }
  }

  private async findReferrer(code?: string | null) {
    const c = String(code ?? '').trim().toUpperCase();
    if (!c) return null;
    const { data } = await this.supabase
      .from('referrers')
      .select('id, referral_code, is_active')
      .eq('referral_code', c)
      .maybeSingle();
    if (!data || !(data as any).is_active) {
      throw new BadRequestException('Invalid referral code');
    }
    return data as any;
  }

  private newClaimToken(): string {
    return randomBytes(32).toString('hex');
  }

  private async buildOrder(args: {
    plan_id: string;
    userId: string | null;
    email?: string | null;
    phone?: string | null;
    channel?: string | null;
    referral_code?: string | null;
  }) {
    const { data: plan, error: planError } = await this.supabase
      .from('plans')
      .select('*')
      .eq('id', args.plan_id)
      .single();
    if (planError || !plan) throw new NotFoundException('Plan not found');
    if ((plan as any).is_enterprise)
      throw new BadRequestException('Enterprise plans require contacting sales');

    const email = args.email?.trim().toLowerCase() || null;
    const phone = args.phone?.trim() || null;
    const wantsNone = String(args.channel) === 'none';
    if (!args.userId && !email && !phone && !wantsNone) {
      throw new BadRequestException('Email or phone required for guest checkout');
    }
    const channel = ['email', 'sms', 'both', 'none'].includes(String(args.channel))
      ? String(args.channel)
      : email && phone
        ? 'both'
        : phone && !email
          ? 'sms'
          : 'email';
    if (channel !== 'sms' && channel !== 'none' && !email && args.userId == null) {
      throw new BadRequestException('Email required for email notifications');
    }

    // Referido: valida código + % descuento vigente (admin)
    let referrer: any = null;
    let discountPercent = 0;
    if (args.referral_code) {
      referrer = await this.findReferrer(args.referral_code);
      const cfg = await this.getReferralConfig();
      discountPercent = Math.min(Math.max(Number(cfg.discount) || 0, 0), 90);
    }

    const original = round2(Number((plan as any).price));
    const amount = round2(original * (1 - discountPercent / 100));

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + (plan as any).duration_months);

    const { data: subscription, error: subError } = await this.supabase
      .from('subscriptions')
      .insert({
        user_id: args.userId,
        plan_id: args.plan_id,
        status: 'pending',
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();
    if (subError || !subscription) {
      throw subError ?? new BadRequestException('Could not create subscription');
    }

    const transactionRef = `TXN-${uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
    const claimToken = this.newClaimToken();

    const { data: payment, error: payError } = await this.supabase
      .from('payments')
      .insert({
        user_id: args.userId,
        subscription_id: (subscription as any).id,
        plan_id: args.plan_id,
        amount,
        amount_original: original,
        discount_percent: discountPercent,
        currency: (plan as any).currency,
        status: 'pending',
        transaction_ref: transactionRef,
        payment_method: 'qr_code',
        guest_email: email,
        guest_phone: phone,
        contact_channel: channel,
        claim_token: claimToken,
        referral_code: referrer ? referrer.referral_code : (args.referral_code?.trim().toUpperCase() ?? null),
        referrer_id: referrer ? referrer.id : null,
      })
      .select()
      .single();

    if (payError || !payment) {
      await this.supabase.from('subscriptions').delete().eq('id', (subscription as any).id);
      throw payError ?? new BadRequestException('Could not create payment');
    }

    const qrPayload = signQrPayload({
      transaction_ref: transactionRef,
      amount,
      currency: (plan as any).currency,
      plan: (plan as any).name,
      payment_id: (payment as any).id,
    });
    const qrCodeBase64 = await QRCode.toDataURL(qrPayload, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    });
    await this.supabase.from('payments').update({ qr_code_data: qrCodeBase64 }).eq('id', (payment as any).id);

    await this.supabase.from('event_logs').insert({
      actor_id: args.userId,
      action: 'payment_initiated',
      entity_type: 'payment',
      entity_id: (payment as any).id,
      details: {
        plan_name: (plan as any).name,
        amount,
        amount_original: original,
        discount_percent: discountPercent,
        referral_code: referrer?.referral_code ?? null,
        guest: !args.userId,
        transaction_ref: transactionRef,
      },
    });

    return {
      payment_id: (payment as any).id,
      claim_token: claimToken,
      transaction_ref: transactionRef,
      amount,
      amount_original: original,
      discount_percent: discountPercent,
      currency: (plan as any).currency,
      plan_name: (plan as any).name,
      qr_code: qrCodeBase64,
      status: 'pending',
    };
  }

  /** Orden con login (mantiene compat + ahora acepta referido y canal). */
  async createOrder(plan_id: string, authUserId: string, opts?: { referral_code?: string; contact_channel?: string }) {
    if (!authUserId) throw new ForbiddenException('Authentication required');
    return this.buildOrder({ plan_id, userId: authUserId, referral_code: opts?.referral_code, channel: opts?.contact_channel });
  }

  /** Orden guest SIN login: email y/o teléfono + referido opcional. */
  async createGuestOrder(dto: { plan_id: string; email?: string; phone?: string; contact_channel?: string; referral_code?: string }) {
    return this.buildOrder({
      plan_id: dto.plan_id,
      userId: null,
      email: dto.email,
      phone: dto.phone,
      channel: dto.contact_channel,
      referral_code: dto.referral_code,
    });
  }

  private checkClaim(payment: any, claim?: string) {
    if (!claim || payment.claim_token == null) return false;
    try {
      const a = Buffer.from(String(claim));
      const b = Buffer.from(String(payment.claim_token));
      if (a.length !== b.length) return false;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { timingSafeEqual } = require('node:crypto');
      return timingSafeEqual(a, b);
    } catch {
      return payment.claim_token === claim;
    }
  }

  async getPaymentStatus(paymentId: string, authUser?: any) {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*, plans(*)')
      .eq('id', paymentId)
      .single();
    if (error || !data) throw new NotFoundException('Payment not found');
    const role = authUser?.role;
    if (role !== 'admin' && role !== 'staff' && (data as any).user_id !== authUser?.id) {
      throw new ForbiddenException('Not your payment');
    }
    try {
      const { data: license } = await this.supabase
        .from('licenses')
        .select('*')
        .eq('payment_id', paymentId)
        .maybeSingle();
      return { ...data, license: license ?? null };
    } catch {
      return data;
    }
  }

  /** Estado público guest: exige claim_token (sin JWT). Retorna subset seguro. */
  async getPublicStatus(paymentId: string, claim: string) {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*, plans(name)')
      .eq('id', paymentId)
      .single();
    if (error || !data) throw new NotFoundException('Payment not found');
    if (!this.checkClaim(data, claim)) throw new ForbiddenException('Invalid claim token');
    let license: any = null;
    try {
      const r = await this.supabase.from('licenses').select('*').eq('payment_id', paymentId).maybeSingle();
      license = r.data ?? null;
    } catch {
      license = null;
    }
    const { claim_token: _omit, qr_code_data: _qr, ...safe } = data as any;
    return {
      ...safe,
      payment_id: (data as any).id,
      status: (data as any).status,
      amount: (data as any).amount,
      amount_original: (data as any).amount_original,
      discount_percent: (data as any).discount_percent,
      currency: (data as any).currency,
      transaction_ref: (data as any).transaction_ref,
      referral_code: (data as any).referral_code,
      license,
    };
  }

  async findAll(page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await this.supabase
      .from('payments')
      .select('*, plans(name), profiles(full_name, role)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return { data, total: count, page, limit };
  }

  /** Crea (o reutiliza) el perfil del comprador guest al confirmar. */
  private async ensureUserForPayment(payment: any) {
    if (payment.user_id) return payment.user_id;
    const email = payment.guest_email?.trim().toLowerCase() || null;
    if (!email) return null; // solo teléfono: queda guest hasta que defina email
    const { data: existing } = await this.supabase.from('profiles').select('id').eq('email', email).maybeSingle();
    if (existing) return (existing as any).id;
    const randomPass = randomBytes(24).toString('hex');
    const password_hash = await bcrypt.hash(randomPass, 10);
    const fullName = email.split('@')[0].replace(/[._-]+/g, ' ').trim() || 'Cliente MiVenta';
    const { data: created, error } = await this.supabase
      .from('profiles')
      .insert({
        email,
        password_hash,
        full_name: fullName,
        phone: payment.guest_phone ?? null,
        role: 'customer',
        referral_code_used: payment.referral_code ?? null,
      })
      .select('id')
      .single();
    if (error) {
      const retry = await this.supabase.from('profiles').select('id').eq('email', email).maybeSingle();
      if (retry.data) return (retry.data as any).id;
      throw error;
    }
    await this.supabase.from('event_logs').insert({
      actor_id: (created as any).id,
      action: 'user_auto_registered',
      entity_type: 'profile',
      entity_id: (created as any).id,
      details: { via: 'guest_payment', payment_id: payment.id },
    });
    return (created as any).id;
  }

  // Webhook/callback for payment confirmation: registra user + licencia + referido + aviso.
  async confirmPayment(paymentId: string) {
    const { data: payment, error: fetchError } = await this.supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();
    if (fetchError || !payment) throw new NotFoundException('Payment not found');
    // Era guest si aún no tiene usuario atado (para account_created real)
    const wasGuest = !(payment as any).user_id;

    try {
      const { data: existing } = await this.supabase
        .from('licenses')
        .select('*')
        .eq('payment_id', paymentId)
        .maybeSingle();
      if (existing) {
        return {
          status: 'completed',
          payment_id: paymentId,
          license_key: (existing as any).license_key,
          license: existing,
          reused: true,
        };
      }
    } catch {
      // tabla licenses aún no migrada: seguir
    }

    const { data: plan } = await this.supabase
      .from('plans')
      .select('*')
      .eq('id', (payment as any).plan_id)
      .maybeSingle();

    // 1. Registrar usuario guest (si hay email) y atar pago+suscripción
    let userId = (payment as any).user_id as string | null;
    try {
      const ensured = await this.ensureUserForPayment(payment);
      if (ensured && ensured !== userId) {
        userId = ensured;
        await this.supabase.from('payments').update({ user_id: ensured }).eq('id', paymentId);
        if ((payment as any).subscription_id) {
          await this.supabase.from('subscriptions').update({ user_id: ensured }).eq('id', (payment as any).subscription_id);
        }
        (payment as any).user_id = ensured;
      }
    } catch {
      // no bloquea: la licencia puede emitirse igual si licenses tolera guest
    }

    await this.supabase
      .from('payments')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', paymentId);

    if ((payment as any).subscription_id) {
      await this.supabase
        .from('subscriptions')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', (payment as any).subscription_id);
    }

    await this.supabase.from('event_logs').insert({
      actor_id: userId,
      action: 'payment_completed',
      entity_type: 'payment',
      entity_id: paymentId,
      details: {
        amount: (payment as any).amount,
        currency: (payment as any).currency,
        referral_code: (payment as any).referral_code,
        guest: !(payment as any).user_id && !userId ? true : !payment.user_id,
      },
    });

    // 2. Atribución al referido (contabiliza comisión del dueño del código)
    try {
      if ((payment as any).referrer_id) {
        const cfg = await this.getReferralConfig();
        const commission = round2(Number((payment as any).amount) * (Number(cfg.commission) || 0) / 100);
        await this.supabase.from('payments').update({ commission_amount: commission }).eq('id', paymentId);
        const { data: already } = await this.supabase
          .from('referral_uses')
          .select('id')
          .eq('payment_id', paymentId)
          .maybeSingle();
        if (!already) {
          await this.supabase.from('referral_uses').insert({
            referrer_id: (payment as any).referrer_id,
            payment_id: paymentId,
            buyer_email: (payment as any).guest_email,
            buyer_phone: (payment as any).guest_phone,
            discount_percent: (payment as any).discount_percent ?? 0,
            commission_amount: commission,
          });
          const { data: ref } = await this.supabase
            .from('referrers')
            .select('total_referrals, total_earnings')
            .eq('id', (payment as any).referrer_id)
            .single();
          if (ref) {
            await this.supabase
              .from('referrers')
              .update({
                total_referrals: Number((ref as any).total_referrals ?? 0) + 1,
                total_earnings: round2(Number((ref as any).total_earnings ?? 0) + commission),
                updated_at: new Date().toISOString(),
              })
              .eq('id', (payment as any).referrer_id);
          }
          await this.supabase.from('event_logs').insert({
            actor_id: userId,
            action: 'referral_paid',
            entity_type: 'payment',
            entity_id: paymentId,
            details: {
              referrer_id: (payment as any).referrer_id,
              referral_code: (payment as any).referral_code,
              commission_amount: commission,
            },
          });
        }
      }
    } catch {
      // no bloquea la licencia
    }

    // 3. Emitir licencia POS (el pago YA quedó completed; si falla se
    // retorna el motivo para diagnóstico y el reintento la crea idempotente).
    let license: any = null;
    try {
      license = await this.licenses.issueForPayment({ ...(payment as any), user_id: userId }, plan);
    } catch (e: any) {
      this.logger.error(`license issue failed for payment ${paymentId}: ${e?.message ?? e}`);
      invalidateDashboardCache();
      return {
        status: 'completed',
        payment_id: paymentId,
        license_key: null,
        licenseError: 'license-pending',
        licenseReason: e?.message ?? String(e),
        user_id: userId,
      };
    }

    // 4. Avisar al comprador por el canal elegido (email y/o SMS)
    try {
      await this.notifyBuyer(paymentId, {}, true);
    } catch {
      // best-effort
    }

    invalidateDashboardCache();
    return {
      status: 'completed',
      payment_id: paymentId,
      license_key: (license as any)?.license_key ?? null,
      license,
      user_id: userId,
      account_created: wasGuest && !!userId,
    };
  }

  /**
   * Envía la licencia al correo/teléfono que defina el comprador.
   * - Guest: exige claim_token. Autenticado dueño/admin: sin claim.
   * - Si se pasan email/phone nuevos, se guardan en el pago (guest).
   */
  async notifyBuyer(
    paymentId: string,
    opts: { claim?: string; email?: string; phone?: string; channel?: string },
    internal = false,
  ) {
    const { data: payment, error } = await this.supabase.from('payments').select('*').eq('id', paymentId).single();
    if (error || !payment) throw new NotFoundException('Payment not found');
    // Seguridad: toda orden nueva tiene claim_token; exigirlo salvo llamada
    // interna (webhook) para evitar que terceros pidan la licencia o la
    // redirijan a otro contacto. Órdenes legacy sin claim quedan para admin.
    if (!internal) {
      if ((payment as any).claim_token) {
        if (!this.checkClaim(payment, opts.claim)) throw new ForbiddenException('Invalid claim token');
      } else if (!(payment as any).user_id) {
        throw new ForbiddenException('Invalid claim token');
      }
    }
    const updates: Record<string, any> = {};
    if (opts.email?.includes('@')) updates.guest_email = opts.email.trim().toLowerCase();
    if (opts.phone?.trim()) updates.guest_phone = opts.phone.trim();
    if (opts.channel && ['email', 'sms', 'both', 'none'].includes(opts.channel)) updates.contact_channel = opts.channel;
    if (Object.keys(updates).length) {
      await this.supabase.from('payments').update(updates).eq('id', paymentId);
      Object.assign(payment, updates);
    }

    const license = await this.licenses.findByPayment(paymentId);
    if (!license) throw new BadRequestException('License not ready yet');

    const toEmail = (payment as any).guest_email || (await this.licenses.resolvePaymentEmail(paymentId, (payment as any).user_id));
    const toPhone = (payment as any).guest_phone || null;
    const channel = (payment as any).contact_channel || 'email';

    // Canal "none": el comprador indicó que no quiere aviso; la llave
    // queda visible en pantalla y en Mis suscripciones.
    if (channel === 'none') {
      return { emailed: false, smsSent: false, toEmail: toEmail ?? null, toPhone: toPhone ?? null, channel, emailReason: 'channel-none', smsReason: 'channel-none' };
    }

    let emailed = false;
    let smsSent = false;
    let emailReason: string | undefined;
    let smsReason: string | undefined;

    if ((channel === 'email' || channel === 'both') && toEmail) {
      const r = await this.licenseMail.sendLicenseEmail(toEmail, (license as any).license_key, {});
      emailed = r.emailed;
      emailReason = r.reason;
      if (emailed) {
        await this.supabase.from('licenses').update({ emailed_at: new Date().toISOString() }).eq('id', (license as any).id);
      }
    }
    if ((channel === 'sms' || channel === 'both') && toPhone) {
      const r = await this.sms.sendSms(toPhone, `MiVenta: tu llave es ${(license as any).license_key}`);
      smsSent = r.sent;
      smsReason = r.reason;
    }
    return { emailed, smsSent, toEmail: toEmail ?? null, toPhone: toPhone ?? null, channel, emailReason, smsReason };
  }

  /**
   * Reeditar datos de contacto del QR ya creado (SIN regenerar QR).
   * Solo mientras el pago sigue pending; exige claim_token.
   */
  async updateContact(
    paymentId: string,
    dto: { claim?: string; email?: string; phone?: string; channel?: string },
  ) {
    const { data: payment, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();
    if (error || !payment) throw new NotFoundException('Payment not found');
    if (!this.checkClaim(payment, dto.claim)) throw new ForbiddenException('Invalid claim token');
    if ((payment as any).status !== 'pending') {
      throw new BadRequestException('Payment already processed, contact can no longer be edited');
    }
    const channel = dto.channel ?? (payment as any).contact_channel ?? 'email';
    if (!['email', 'sms', 'both', 'none'].includes(channel)) {
      throw new BadRequestException('Invalid channel');
    }
    const email = dto.email !== undefined ? dto.email.trim().toLowerCase() || null : (payment as any).guest_email;
    const phone = dto.phone !== undefined ? dto.phone.trim() || null : (payment as any).guest_phone;
    if (channel !== 'none' && !(payment as any).user_id && !email && !phone) {
      throw new BadRequestException('Email or phone required for guest checkout');
    }
    if (channel !== 'sms' && channel !== 'none' && !email && !(payment as any).user_id) {
      throw new BadRequestException('Email required for email notifications');
    }
    const { data: updated, error: upErr } = await this.supabase
      .from('payments')
      .update({
        guest_email: email,
        guest_phone: phone,
        contact_channel: channel,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select('id, status, guest_email, guest_phone, contact_channel, referral_code, discount_percent, amount, amount_original, currency, transaction_ref')
      .single();
    if (upErr) throw upErr;
    return updated;
  }

  /**
   * Simulación de la pasarela: el proveedor "cobra" y avisa al webhook.
   * Reutiliza confirmPayment (misma secuencia que webhook/confirm:
   * registro de usuario + licencia + referido + notificación).
   * Solo con claim_token del dueño y pago pending. Desactivable con
   * PAYMENT_SIMULATION_ENABLED=false.
   */
  async simulatePayment(paymentId: string, claim?: string) {
    if (String(process.env.PAYMENT_SIMULATION_ENABLED ?? 'true').toLowerCase() === 'false') {
      throw new ForbiddenException('Simulation disabled');
    }
    const { data: payment, error } = await this.supabase
      .from('payments')
      .select('id, status, claim_token')
      .eq('id', paymentId)
      .single();
    if (error || !payment) throw new NotFoundException('Payment not found');
    if (!this.checkClaim(payment, claim)) throw new ForbiddenException('Invalid claim token');
    if ((payment as any).status !== 'pending') {
      throw new BadRequestException('Payment already processed');
    }
    await this.supabase.from('event_logs').insert({
      action: 'payment_simulated',
      entity_type: 'payment',
      entity_id: paymentId,
      details: { via: 'simulate-button' },
    });
    return this.confirmPayment(paymentId);
  }

  /** El comprador guest define su contraseña para la cuenta auto-creada. */
  async claimAccount(paymentId: string, dto: { claim: string; password: string; full_name?: string }) {    const { data: payment, error } = await this.supabase.from('payments').select('*').eq('id', paymentId).single();
    if (error || !payment) throw new NotFoundException('Payment not found');
    if (!this.checkClaim(payment, dto.claim)) throw new ForbiddenException('Invalid claim token');
    if (!(payment as any).user_id) throw new BadRequestException('Account not created yet (payment pending?)');
    if (!dto.password || dto.password.length < 8) throw new BadRequestException('Password min 8 chars');
    const password_hash = await bcrypt.hash(dto.password, 10);
    const upd: Record<string, any> = { password_hash, updated_at: new Date().toISOString() };
    if (dto.full_name?.trim()) upd.full_name = dto.full_name.trim();
    await this.supabase.from('profiles').update(upd).eq('id', (payment as any).user_id);
    await this.supabase.from('event_logs').insert({
      actor_id: (payment as any).user_id,
      action: 'account_claimed',
      entity_type: 'payment',
      entity_id: paymentId,
    });
    return { claimed: true };
  }
}
