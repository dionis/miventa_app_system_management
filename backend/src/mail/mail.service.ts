import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

function smtpConfigured(config: ConfigService): boolean {
  return Boolean(
    config.get<string>('SMTP_HOST') && config.get<string>('SMTP_USER'),
  );
}

/**
 * P1: notificaciones de correo (registro/confirmación).
 * Sin SMTP configurado funciona en modo dev: loguea el enlace
 * en vez de enviarlo. Nunca bloquea el registro.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger('MailService');

  constructor(private config: ConfigService) {}

  private transporter() {
    return nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: Number(this.config.get<string>('SMTP_PORT') || 587),
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  private from(): string {
    return (
      this.config.get<string>('SMTP_FROM') || 'MiVenta <no-reply@miventa.app>'
    );
  }

  async sendVerificationEmail(
    to: string,
    fullName: string,
    token: string,
    lang = 'es',
  ): Promise<{ sent: boolean }> {
    const base =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const link = `${base.replace(/\/$/, '')}/verify-email?token=${token}`;
    const isEs = lang?.toLowerCase().startsWith('es');
    const subject = isEs
      ? 'Confirma tu registro en MiVenta'
      : 'Confirm your MiVenta registration';
    const greeting = isEs ? `Hola ${fullName || ''},` : `Hi ${fullName || ''},`;
    const body = isEs
      ? 'Gracias por registrarte. Confirma tu correo en las próximas 24 horas:'
      : 'Thanks for signing up. Please confirm your email within 24 hours:';
    const text = `${greeting}\n\n${body}\n${link}\n\nSi no creaste esta cuenta, ignora este mensaje.`;

    if (!smtpConfigured(this.config)) {
      this.logger.warn(
        `SMTP no configurado. Enlace de verificación para ${to}: ${link}`,
      );
      return { sent: false };
    }
    try {
      await this.transporter().sendMail({
        from: this.from(),
        to,
        subject,
        text,
        html: `<p>${greeting}</p><p>${body}</p><p><a href="${link}">${link}</a></p>`,
      });
      return { sent: true };
    } catch (err: any) {
      this.logger.error(`No se pudo enviar correo a ${to}: ${err?.message}`);
      return { sent: false };
    }
  }
}
