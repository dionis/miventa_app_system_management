import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const normalized = email?.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalized);
    if (user && (await bcrypt.compare(pass, user.password_hash))) {
      const { password_hash, ...result } = user;
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
    const user = await this.usersService.create({
      ...safe,
      email: safe.email?.trim().toLowerCase(),
    });
    return this.login(user);
  }
}
