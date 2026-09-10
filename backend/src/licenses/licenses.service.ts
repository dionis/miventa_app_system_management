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
    try {
      const email = await this.mail.resolveRecipientEmail(payment.user_id);
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
      actor_id: payment.user_id,
      action: 'license_issued',
      entity_type: 'license',
      entity_id: (data as any).id,
      details: {
        payment_id: payment.id,
        license_type: gen.licenseType,
        pos_count: gen.posCount,
        days: gen.days,
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
    const email = await this.mail.resolveRecipientEmail((license as any).user_id);
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
}
