import { Injectable, Logger } from '@nestjs/common';
import { getSupabaseAdmin } from '../config/supabase';

/**
 * Envío de llave por correo.
 * - Si RESEND_API_KEY está configurado usa Resend (fetch, sin deps nuevas).
 * - Si no, hace log + marca como no enviado para reintento manual.
 * Nunca lanza: el pago/webhook no debe fallar por el email.
 */
@Injectable()
export class LicenseMailService {
  private readonly logger = new Logger(LicenseMailService.name);

  async sendLicenseEmail(to: string, licenseKey: string, meta: { planName?: string; expiresAt?: string }): Promise<{ emailed: boolean; reason?: string }> {
    if (!to || !to.includes('@')) {
      return { emailed: false, reason: 'missing-recipient' };
    }
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM || 'MiVenta <no-reply@miventa.local>';
    if (!apiKey) {
      this.logger.warn(`RESEND_API_KEY ausente. Llave ${licenseKey} para ${to} solo en log.`);
      return { emailed: false, reason: 'mailer-not-configured' };
    }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: `Tu llave de licencia ${meta.planName ?? ''}`.trim(),
          text: [
            'Tu pago fue confirmado.',
            `Llave: ${licenseKey}`,
            meta.expiresAt ? `Expira: ${meta.expiresAt}` : '',
            'Guárdala en un lugar seguro. Puedes copiarla desde tu panel.',
          ]
            .filter(Boolean)
            .join('\n'),
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.error(`Resend ${res.status}: ${body}`);
        return { emailed: false, reason: `resend-${res.status}` };
      }
      return { emailed: true };
    } catch (e: any) {
      this.logger.error(`sendLicenseEmail: ${e?.message ?? e}`);
      return { emailed: false, reason: 'send-error' };
    }
  }

  async resolveRecipientEmail(userId: string): Promise<string | null> {
    try {
      const { data } = await getSupabaseAdmin()
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      return (data as any)?.email ?? null;
    } catch {
      return null;
    }
  }
}
