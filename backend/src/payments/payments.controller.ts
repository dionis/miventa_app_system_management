import {
  Controller,
  Post,
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
  @ApiOperation({ summary: 'Crear orden de pago (usuario autenticado)' })
  @ApiResponse({ status: 201, description: 'Orden creada con QR firmado' })
  @Throttle({ default: { limit: 10, ttl: 60 * 1000 } })
  createOrder(@Body() dto: CreateOrderDto, @Request() req) {
    const authUserId = req.user.id;
    if (dto.user_id && dto.user_id !== authUserId) {
      throw new ForbiddenException('user_id does not match authenticated user');
    }
    return this.paymentsService.createOrder(dto.plan_id, authUserId);
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getStatus(@Param('id') id: string, @Request() req) {
    return this.paymentsService.getPaymentStatus(id, req.user);
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
