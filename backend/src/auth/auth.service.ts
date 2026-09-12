import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getSupabaseAdmin } from '../config/supabase';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

function newVerificationToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const normalized = email?.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalized);
    if (user && (await bcrypt.compare(pass, user.password_hash))) {
      const { password_hash, email_verification_token, ...result } = user;
      return result;
    }
    return null;
  }

  private signAccess(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN') || '15m',
    } as any);
  }

  private signRefresh(user: any) {
    const refreshSecret =
      this.config.get<string>('JWT_REFRESH_SECRET') ||
      this.config.get<string>('JWT_SECRET');
    const payload = { sub: user.id, type: 'refresh' };
    return this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    } as any);
  }

  async login(user: any) {
    return {
      access_token: this.signAccess(user),
      refresh_token: this.signRefresh(user),
      user,
    };
  }

  async refresh(refreshToken: string) {
    const refreshSecret =
      this.config.get<string>('JWT_REFRESH_SECRET') ||
      this.config.get<string>('JWT_SECRET');
    try {
      const decoded: any = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });
      if (decoded?.type !== 'refresh' || !decoded?.sub) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const profile = await this.usersService.findOne(decoded.sub);
      return {
        access_token: this.signAccess(profile),
        user: profile,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async register(userData: any) {
    // Forzar rol customer: el rol solo se cambia desde DB/admin, nunca desde registro público
    const { role: _ignored, ...safe } = userData;
    const fullName =
      [safe.first_name?.trim(), safe.last_name?.trim()]
        .filter(Boolean)
        .join(' ') || safe.full_name?.trim() || '';
    const { token, hash } = newVerificationToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    let user;
    try {
      user = await this.usersService.create({
        email: safe.email?.trim().toLowerCase(),
        password: safe.password,
        full_name: fullName,
        company: safe.company?.trim() || null,
        phone: safe.phone?.trim() || null,
        secondary_phone: safe.secondary_phone?.trim() || null,
        email_verified: false,
        email_verification_token: hash,
        email_verification_expires: expires,
      });
    } catch (err: any) {
      if (err?.code === '23505') throw new ConflictException('Email already exists');
      throw err;
    }
    const { sent } = await this.mail.sendVerificationEmail(
      user.email,
      fullName,
      token,
      safe.lang || 'es',
    );
    const session = await this.login(user);
    return { ...session, email_sent: sent };
  }

  async verifyEmail(token: string) {
    if (!token) throw new BadRequestException('Missing token');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('profiles')
      .select('id, email_verified, email_verification_expires')
      .eq('email_verification_token', hash)
      .single();
    if (error || !data) throw new BadRequestException('Invalid token');
    if (data.email_verified) return { verified: true, already: true };
    if (
      data.email_verification_expires &&
      new Date(data.email_verification_expires).getTime() < Date.now()
    ) {
      throw new BadRequestException('Token expired. Request a new email.');
    }
    const { error: upErr } = await sb
      .from('profiles')
      .update({
        email_verified: true,
        email_verification_token: null,
        email_verification_expires: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id);
    if (upErr) throw upErr;
    await sb.from('event_logs').insert({
      actor_id: data.id,
      action: 'email_verified',
      entity_type: 'profile',
      entity_id: data.id,
    });
    return { verified: true };
  }

  async resendVerification(email: string, lang = 'es') {
    const normalized = email?.trim().toLowerCase();
    if (!normalized) throw new BadRequestException('Email required');
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('profiles')
      .select('id, full_name, email_verified')
      .eq('email', normalized)
      .single();
    // Respuesta genérica para no enumerar correos
    if (error || !data) return { sent: false };
    if (data.email_verified) return { sent: false, already: true };
    const { token, hash } = newVerificationToken();
    await sb
      .from('profiles')
      .update({
        email_verification_token: hash,
        email_verification_expires: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id);
    const { sent } = await this.mail.sendVerificationEmail(
      normalized,
      data.full_name || '',
      token,
      lang,
    );
    return { sent };
  }
}
