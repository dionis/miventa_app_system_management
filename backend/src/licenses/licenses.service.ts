import { Injectable, BadRequestException } from '@nestjs/common';
import { getSupabaseAdmin } from '../config/supabase';
import {
  generateLicenseKey,
  getLicenseInfo,
  monthsToDays,
  normalizeLicenseType,
  normalizePosCount,
  sha256Hex,
  validateLicenseKey,
} from './license.crypto';
import { LicenseMailService } from './mail.service';

@Injectable()
export class LicensesService {
  private get supabase() {
    return getSupabaseAdmin();
  }

  constructor(private readonly mail: LicenseMailService) {}

  async findByPayment(paymentId: string) {
    const { data } = await this.supabase
      .from('licenses')
      .select('*')
      .eq('payment_id', paymentId)
      .maybeSingle();
    return data ?? null;
  }

  async findMine(userId: string) {
    const { data, error } = await this.supabase
      .from('licenses')
      .select('*, plans(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  validate(key: string) {
    const days = validateLicenseKey(key);
    if (days < 0) throw new BadRequestException('Invalid license key');
    return getLicenseInfo(key);
  }

  /** Diagnóstico: confirma que las migraciones 004-007 están aplicadas. */
  async checkTables() {
    const check = async (table: string) => {
      try {
        const { error } = await this.supabase.from(table).select('*', { head: true }).limit(1);
        return { table, ok: !error, error: error?.message ?? null };
      } catch (e: any) {
        return { table, ok: false, error: e?.message ?? String(e) };
      }
    };
    const tables = await Promise.all(
      ['licenses', 'referral_uses', 'app_settings', 'payments', 'subscriptions', 'plans'].map(check),
    );
    // Rol de la clave configurada (SIN exponerla): service_role evita RLS.
    const raw = String(process.env.SUPABASE_SERVICE_ROLE_KEY ?? '');
    let keyRole = 'unknown';
    if (raw.split('.').length === 3) {
      try {
        keyRole = JSON.parse(Buffer.from(raw.split('.')[1], 'base64').toString()).role ?? 'unknown';
      } catch {
        keyRole = 'undecodable-jwt';
      }
    } else if (raw.startsWith('sb_secret_')) {
      keyRole = 'service_role(secret-key)';
    } else if (raw.startsWith('sb_publishable_')) {
      keyRole = 'anon(publishable-key)';
    }
    const isServiceRole = keyRole === 'service_role' || keyRole.startsWith('service_role(');
    return { ok: tables.every((t) => t.ok), tables, keyRole, isServiceRole };
  }

  /**
   * Emite (o retorna existente) la licencia de un pago confirmado.
   * Idempotente por payment_id: reintentos del webhook retornan la misma llave.
   */
  async issueForPayment(payment: any, plan: any) {
    const existing = await this.findByPayment(payment.id);
    if (existing) return existing;

    const tier = String(plan?.tier ?? '').toLowerCase();
    const licenseType = normalizeLicenseType(
      tier === 'premium' || tier === 'normal'
        ? tier
        : String(plan?.key ?? '').startsWith('premium')
          ? 'premium'
          : 'normal',
    );
    const days =
      Number(plan?.duration_days) > 0
        ? Math.min(Math.floor(Number(plan.duration_days)), 9999)
        : monthsToDays(plan?.duration_months);
    const posCount = normalizePosCount(plan?.pos_count ?? 5);

    const gen = generateLicenseKey({ days, licenseType, posCount });
    const keyHash = sha256Hex(gen.key);

    const { data, error } = await this.supabase
      .from('licenses')
      .insert({
        payment_id: payment.id,
        subscription_id: payment.subscription_id,
        user_id: payment.user_id,
        plan_id: payment.plan_id,
        license_key: gen.key,
        key_hash: keyHash,
        license_type: gen.licenseType,
        pos_count: gen.posCount,
        days: gen.days,
        status: 'active',
        expires_at: gen.expiresAt.toISOString(),
      })
      .select()
      .single();

    // Carrera webhook doble: si otro worker insertó primero, leer el existente.
    if (error) {
      const retry = await this.findByPayment(payment.id);
      if (retry) return retry;
      throw error;
    }

    // Email best-effort (no bloquea). Marca emailed_at solo si se envió.
    // user_id puede ser null (guest solo-teléfono): se usa guest_email.
    try {
      const email =
        (payment.user_id
          ? await this.mail.resolveRecipientEmail(payment.user_id).catch(() => null)
          : null) ||
        payment.guest_email ||
        null;
      if (email) {
        const sent = await this.mail.sendLicenseEmail(email, gen.key, {
          planName: plan?.name,
          expiresAt: gen.expiresAt.toISOString(),
        });
        if (sent.emailed) {
          await this.supabase
            .from('licenses')
            .update({ emailed_at: new Date().toISOString() })
            .eq('id', (data as any).id);
        }
      }
    } catch {
      // ignorar: reenvío manual disponible
    }

    await this.supabase.from('event_logs').insert({
      actor_id: payment.user_id ?? null,
      action: 'license_issued',
      entity_type: 'license',
      entity_id: (data as any).id,
      details: {
        payment_id: payment.id,
        license_type: gen.licenseType,
        pos_count: gen.posCount,
        days: gen.days,
        buyer_email: payment.guest_email ?? null,
        buyer_phone: payment.guest_phone ?? null,
      },
    });

    return data;
  }

  async resendEmail(paymentId: string, authUser: any) {
    const license = await this.findByPayment(paymentId);
    if (!license) throw new BadRequestException('License not ready yet');
    const role = authUser?.role;
    if (role !== 'admin' && role !== 'staff' && (license as any).user_id !== authUser?.id) {
      throw new BadRequestException('Not your license');
    }
    const email = await this.resolvePaymentEmail(paymentId, (license as any).user_id);
    if (!email) throw new BadRequestException('No email for user');
    const sent = await this.mail.sendLicenseEmail(email, (license as any).license_key, {});
    if (sent.emailed) {
      await this.supabase
        .from('licenses')
        .update({ emailed_at: new Date().toISOString() })
        .eq('id', (license as any).id);
    }
    return { emailed: sent.emailed, to: email, reason: sent.reason };
  }

  /** Email del perfil o, para guest, el guest_email del pago. */
  async resolvePaymentEmail(paymentId: string, userId?: string | null): Promise<string | null> {
    if (userId) {
      const email = await this.mail.resolveRecipientEmail(userId);
      if (email) return email;
    }
    try {
      const { data } = await this.supabase
        .from('payments')
        .select('guest_email')
        .eq('id', paymentId)
        .maybeSingle();
      return (data as any)?.guest_email ?? null;
    } catch {
      return null;
    }
  }
}
