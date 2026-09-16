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
  ApiParam,
  ApiQuery,
  ApiHeader,
  ApiBody,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { GuestCreateOrderDto } from './dto/guest-create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { parsePagination } from '../common/helpers/pagination.helper';
import {
  CreateOrderResponseDto,
  PaymentStatusResponseDto,
  PublicStatusResponseDto,
  NotifyResponseDto,
  SimulateResponseDto,
  TmInitiateResponseDto,
  TmStatusResponseDto,
  WebhookResponseDto,
} from './dto/payment-response.dto';

@ApiTags('payments')
@Controller('api/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear orden de pago (usuario autenticado, con referido opcional)' })
  @ApiResponse({ status: 201, description: 'Orden creada con QR firmado', type: CreateOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Plan no encontrado o datos inválidos' })
  @ApiResponse({ status: 403, description: 'Autenticación requerida' })
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
  @ApiResponse({ status: 201, description: 'Orden guest creada con QR y claim_token', type: CreateOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Email/teléfono requerido o plan inválido' })
  @Throttle({ default: { limit: 10, ttl: 60 * 1000 } })
  guestOrder(@Body() dto: GuestCreateOrderDto) {
    return this.paymentsService.createGuestOrder(dto);
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estado de pago (usuario autenticado)' })
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiResponse({ status: 200, description: 'Estado del pago con licencia si existe', type: PaymentStatusResponseDto })
  @ApiResponse({ status: 403, description: 'No autorizado para ver este pago' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  getStatus(@Param('id') id: string, @Request() req) {
    return this.paymentsService.getPaymentStatus(id, req.user);
  }

  /** Estado público guest con ?claim=<claim_token> (sin JWT). */
  @Get(':id/public-status')
  @ApiOperation({ summary: 'Estado de pago guest (con claim_token, sin JWT)' })
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiQuery({ name: 'claim', required: true, description: 'Claim token retornado al crear la orden' })
  @ApiResponse({ status: 200, description: 'Estado público del pago', type: PublicStatusResponseDto })
  @ApiResponse({ status: 403, description: 'Claim token inválido o requerido' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
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
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        claim: { type: 'string', description: 'Claim token (requerido para guest)' },
        email: { type: 'string', format: 'email', description: 'Email opcional para sobrescribir' },
        phone: { type: 'string', description: 'Teléfono opcional para sobrescribir' },
        channel: { type: 'string', enum: ['email', 'sms', 'both', 'none'], description: 'Canal de envío' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Resultado del envío', type: NotifyResponseDto })
  @ApiResponse({ status: 400, description: 'Licencia no lista aún' })
  @ApiResponse({ status: 403, description: 'Claim token inválido' })
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
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['claim', 'password'],
      properties: {
        claim: { type: 'string', description: 'Claim token' },
        password: { type: 'string', minLength: 8, description: 'Nueva contraseña (mín 8 chars)' },
        full_name: { type: 'string', description: 'Nombre completo opcional' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Cuenta reclamada exitosamente' })
  @ApiResponse({ status: 400, description: 'Contraseña muy corta o cuenta no creada' })
  @ApiResponse({ status: 403, description: 'Claim token inválido' })
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
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        claim: { type: 'string', description: 'Claim token (requerido)' },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string' },
        channel: { type: 'string', enum: ['email', 'sms', 'both', 'none'] },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Contacto actualizado' })
  @ApiResponse({ status: 400, description: 'Pago ya procesado o datos inválidos' })
  @ApiResponse({ status: 403, description: 'Claim token inválido' })
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
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['claim'],
      properties: { claim: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Pago simulado completado', type: SimulateResponseDto })
  @ApiResponse({ status: 400, description: 'Pago ya procesado' })
  @ApiResponse({ status: 403, description: 'Claim token inválido o simulación deshabilitada' })
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
  @ApiOperation({ summary: 'Listar todos los pagos (admin/staff)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada de pagos' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const { page: p, limit: l } = parsePagination(page, limit);
    return this.paymentsService.findAll(p, l);
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmación manual de pago (solo admin)' })
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiResponse({ status: 200, description: 'Pago confirmado y licencia emitida' })
  confirmPayment(@Param('id') id: string) {
    return this.paymentsService.confirmPayment(id);
  }

  /**
   * P1: webhook genérico del proveedor de pagos.
   * El proveedor debe enviar `x-webhook-secret: <PAYMENTS_WEBHOOK_SECRET>`.
   * TODO P2: verificar firma por proveedor (Stripe-Signature, etc.) + idempotencia por event-id.
   */
  @Post('webhook/confirm')
  @ApiOperation({ summary: 'Webhook genérico de proveedor de pagos (firmado por secreto)' })
  @ApiHeader({ name: 'x-webhook-secret', required: true, description: 'Secreto compartido PAYMENTS_WEBHOOK_SECRET' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['payment_id', 'status'],
      properties: {
        payment_id: { type: 'string' },
        status: { type: 'string', enum: ['completed', 'failed'] },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Webhook procesado', type: WebhookResponseDto })
  @ApiResponse({ status: 401, description: 'Secreto inválido' })
  @ApiResponse({ status: 403, description: 'payment_id requerido' })
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
