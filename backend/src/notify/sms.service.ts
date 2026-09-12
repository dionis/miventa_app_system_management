import { Injectable, Logger } from '@nestjs/common';

/**
 * SMS best-effort.
 * - Si TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM están
 *   configurados, envía por Twilio API (fetch, sin SDK nuevo).
 * - Si no, solo loguea y retorna { sent:false } para reintento manual.
 * Nunca lanza: el pago no debe fallar por el SMS.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendSms(to: string, text: string): Promise<{ sent: boolean; reason?: string }> {
    if (!to || to.trim().length < 7) {
      return { sent: false, reason: 'missing-recipient' };
    }
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM;
    if (!sid || !token || !from) {
      this.logger.warn(`SMS no configurado. Para ${to}: ${text.slice(0, 80)}`);
      return { sent: false, reason: 'sms-not-configured' };
    }
    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: to, From: from, Body: text }).toString(),
        },
      );
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.error(`Twilio ${res.status}: ${body}`);
        return { sent: false, reason: `twilio-${res.status}` };
      }
      return { sent: true };
    } catch (e: any) {
      this.logger.error(`sendSms: ${e?.message ?? e}`);
      return { sent: false, reason: 'send-error' };
    }
  }
}
