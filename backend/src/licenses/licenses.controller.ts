import { Controller, Get, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LicensesService } from './licenses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('licenses')
@Controller('api/licenses')
export class LicensesController {
  constructor(private readonly licenses: LicensesService) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mis licencias (llaves emitidas al confirmar pago)' })
  mine(@Request() req) {
    return this.licenses.findMine(req.user.id);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validar llave POS (uso del validador MiVenta)' })
  @Throttle({ default: { limit: 30, ttl: 60 * 1000 } })
  validate(@Body() body: { key?: string }) {
    return this.licenses.validate(String(body?.key ?? ''));
  }

  @Post(':paymentId/resend-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reenviar llave por correo al comprador' })
  @Throttle({ default: { limit: 5, ttl: 60 * 1000 } })
  resend(@Param('paymentId') paymentId: string, @Request() req) {
    return this.licenses.resendEmail(paymentId, req.user);
  }
}
