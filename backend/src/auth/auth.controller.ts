import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  ConflictException,
  Get,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

const isProd = process.env.NODE_ENV === 'production';

function setAuthCookies(res: Response, access: string, refresh?: string) {
  res.cookie('access_token', access, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15m
    path: '/',
  });
  if (refresh) {
    res.cookie('refresh_token', refresh, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
      path: '/api/auth',
    });
  }
}

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60 * 1000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const result = await this.authService.login(user);
    setAuthCookies(res, result.access_token, result.refresh_token);
    return result;
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60 * 1000 } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.authService.register(dto);
      setAuthCookies(res, result.access_token, result.refresh_token);
      return result;
    } catch (error) {
      if (error?.code === '23505') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
  async refresh(
    @Body() body: { refresh_token?: string },
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = body?.refresh_token || req.cookies?.['refresh_token'];
    if (!token) throw new UnauthorizedException('Missing refresh token');
    const result = await this.authService.refresh(token);
    setAuthCookies(res, result.access_token);
    return result;
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth' });
    return { logged_out: true };
  }

  @Get('verify-email')
  @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 60 * 1000 } })
  async resendVerification(@Body() body: { email?: string; lang?: string }) {
    return this.authService.resendVerification(body?.email || '', body?.lang);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    const profile = await this.usersService.findOne(req.user.id);
    return profile;
  }
}
