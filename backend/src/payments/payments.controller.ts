import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
  Query,
  Request,
  ForbiddenException,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { GuestCreateOrderDto } from './dto/guest-create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { parsePagination } from '../common/helpers/pagination.helper';

@ApiTags('payments')
@Controller('api/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear orden de pago (usuario autenticado, con referido opcional)' })
  @ApiResponse({ status: 201, description: 'Orden creada con QR firmado' })
  @Throttle({ default: { limit: 10, ttl: 60 * 1000 } })
  createOrder(@Body() dto: CreateOrderDto & { referral_code?: string }, @Request() req) {
    const authUserId = req.user.id;
    if ((dto as any).user_id && (dto as any).user_id !== authUserId) {
      throw new ForbiddenException('user_id does not match authenticated user');
    }
    return this.paymentsService.createOrder(dto.plan_id, authUserId, {
      referral_code: (dto as any).referral_code,
      contact_channel: (dto as any).contact_channel,
    });
  }

  /**
   * Checkout guest SIN login: email y/o teléfono + código de referido opcional.
   * Retorna claim_token para consultar el estado sin JWT.
   */
  @Post('guest-order')
  @ApiOperation({ summary: 'Crear orden de pago guest (sin login)' })
  @Throttle({ default: { limit: 10, ttl: 60 * 1000 } })
  guestOrder(@Body() dto: GuestCreateOrderDto) {
    return this.paymentsService.createGuestOrder(dto);
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getStatus(@Param('id') id: string, @Request() req) {
    return this.paymentsService.getPaymentStatus(id, req.user);
  }

  /** Estado público guest con ?claim=<claim_token> (sin JWT). */
  @Get(':id/public-status')
  @ApiOperation({ summary: 'Estado de pago guest (con claim_token)' })
  getPublicStatus(@Param('id') id: string, @Query('claim') claim?: string) {
    if (!claim) throw new ForbiddenException('claim required');
    return this.paymentsService.getPublicStatus(id, claim);
  }

  /**
   * Reenviar licencia al correo/teléfono que defina el comprador.
   * Guest: exige claim. Dueño/admin: con JWT (claim opcional).
   */
  @Post(':id/notify')
  @ApiOperation({ summary: 'Enviar licencia por email/SMS al contacto definido' })
  @Throttle({ default: { limit: 5, ttl: 60 * 1000 } })
  notify(
    @Param('id') id: string,
    @Body() body: { claim?: string; email?: string; phone?: string; channel?: string },
  ) {
    return this.paymentsService.notifyBuyer(id, body ?? {});
  }

  /** El comprador guest define su contraseña (cuenta auto-creada al confirmar). */
  @Post(':id/claim-account')
  @ApiOperation({ summary: 'Reclamar cuenta guest con claim_token' })
  @Throttle({ default: { limit: 5, ttl: 60 * 1000 } })
  claimAccount(
    @Param('id') id: string,
    @Body() body: { claim?: string; password?: string; full_name?: string },
  ) {
    if (!body?.claim) throw new ForbiddenException('claim required');
    return this.paymentsService.claimAccount(id, body as any);
  }

  /**
   * Reeditar contacto del QR ya creado (SIN generar otro QR).
   * Solo pending + claim_token del dueño.
   */
  @Patch(':id/contact')
  @ApiOperation({ summary: 'Editar datos de contacto sin regenerar el QR' })
  @Throttle({ default: { limit: 10, ttl: 60 * 1000 } })
  updateContact(
    @Param('id') id: string,
    @Body() body: { claim?: string; email?: string; phone?: string; channel?: string },
  ) {
    if (!body?.claim) throw new ForbiddenException('claim required');
    return this.paymentsService.updateContact(id, body ?? {});
  }

  /**
   * Simulación de la pasarela de pago (demo): la plataforma "cobra",
   * avisa al webhook y sigue la secuencia real (registro + licencia +
   * referido + notificación). Solo pending + claim_token del dueño.
   */
  @Post(':id/simulate')
  @ApiOperation({ summary: 'Simular cobro de la pasarela (demo, 7s en el modal)' })
  @Throttle({ default: { limit: 5, ttl: 60 * 1000 } })
  simulate(
    @Param('id') id: string,
    @Body() body: { claim?: string },
  ) {
    if (!body?.claim) throw new ForbiddenException('claim required');
    return this.paymentsService.simulatePayment(id, body.claim);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const { page: p, limit: l } = parsePagination(page, limit);
    return this.paymentsService.findAll(p, l);
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmación manual (solo admin, temporal)' })
  confirmPayment(@Param('id') id: string) {
    return this.paymentsService.confirmPayment(id);
  }

  /**
   * P1: webhook del proveedor de pagos.
   * El proveedor debe enviar `x-webhook-secret: <PAYMENTS_WEBHOOK_SECRET>`.
   * TODO P2: verificar firma por proveedor (Stripe-Signature, etc.) + idempotencia por event-id.
   */
  @Post('webhook/confirm')
  @ApiOperation({ summary: 'Webhook del proveedor de pagos (firmado por secreto)' })
  @Throttle({ default: { limit: 60, ttl: 60 * 1000 } })
  webhookConfirm(
    @Body() body: { payment_id?: string; status?: string },
    @Headers('x-webhook-secret') secret?: string,
  ) {
    const expected = process.env.PAYMENTS_WEBHOOK_SECRET;
    if (!expected || secret !== expected) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    if (!body?.payment_id) {
      throw new ForbiddenException('payment_id required');
    }
    if (body.status !== 'completed') {
      return { ignored: true };
    }
    return this.paymentsService.confirmPayment(body.payment_id);
  }
}
