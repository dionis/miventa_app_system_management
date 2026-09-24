import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  HttpException,
  HttpStatus,
  UseGuards,
  Request,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiHeader, ApiParam, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TransfermovilService } from './transfermovil.service';
import { PaymentsService } from '../payments/payments.service';
import { TmPayOrderDto, TmRefundPayDto, TmWebhookNotificationDto, TmRefundWebhookNotificationDto } from './dto/tm-pay-order.dto';
import { TmInitiateResponseDto, TmStatusResponseDto, WebhookResponseDto } from '../payments/dto/payment-response.dto';

@ApiTags('transfermovil')
@Controller('api/payments')
export class TransfermovilController {
  constructor(
    private readonly tmService: TransfermovilService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post(':id/tm/initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Iniciar pago en Transfermóvil para una orden existente' })
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiResponse({ status: 200, description: 'QR y OrderId de Transfermóvil generados', type: TmInitiateResponseDto })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  @ApiResponse({ status: 400, description: 'Pago ya procesado' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async initiateTmPayment(@Param('id') id: string, @Request() req) {
    const payment = await this.tmService.initiatePayment(id);
    return {
      qr_code: payment.qr_code,
      tm_order_id: payment.tm_order_id,
      transaction_ref: payment.transaction_ref,
      qr_data: payment.qr_data,
    };
  }

  @Get(':id/tm/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar estado del pago en Transfermóvil' })
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiResponse({ status: 200, description: 'Estado del pago en TM', type: TmStatusResponseDto })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getTmStatus(@Param('id') id: string) {
    const status = await this.tmService.queryStatus(id);
    return { status, payment_id: id };
  }

  @Post(':id/tm/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solicitar devolución en Transfermóvil (solo admin)' })
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refund_id'],
      properties: { refund_id: { type: 'string', example: 'REF-001' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Devolución solicitada en TM' })
  @ApiResponse({ status: 400, description: 'refund_id requerido o pago no elegible' })
  @ApiResponse({ status: 403, description: 'Solo admin' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async requestRefund(@Param('id') id: string, @Body() body: { refund_id: string }) {
    if (!body?.refund_id) {
      throw new BadRequestException('refund_id requerido');
    }
    await this.tmService.requestRefund(id, body.refund_id);
    return { success: true, refund_id: body.refund_id };
  }

  @Post('webhook/tm/notification')
  @ApiOperation({ summary: 'Webhook de notificación de pago Transfermóvil' })
  @ApiHeader({ name: 'x-tm-secret', required: true, description: 'Secreto compartido PAYMENTS_WEBHOOK_SECRET para validar webhook' })
  @ApiBody({ type: TmWebhookNotificationDto })
  @ApiResponse({ status: 200, description: 'Notificación procesada', type: WebhookResponseDto })
  @ApiResponse({ status: 401, description: 'Secreto inválido' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async tmPaymentWebhook(
    @Body() notification: TmWebhookNotificationDto,
    @Headers('x-tm-secret') secret: string,
  ) {
    const expected = process.env.PAYMENTS_WEBHOOK_SECRET;
    if (!expected || secret !== expected) {
      throw new HttpException('Invalid webhook secret', HttpStatus.UNAUTHORIZED);
    }

    const result = await this.tmService.handleWebhookNotification(notification as any);
    
    if (result.action === 'confirm' && result.paymentId) {
      try {
        await this.paymentsService.confirmPayment(result.paymentId);
      } catch (error) {
        this.tmService['logger'].error(`confirmPayment failed for ${result.paymentId}: ${error.message}`);
      }
    }
    
    return { success: true };
  }

  @Post('webhook/tm/refund')
  @ApiOperation({ summary: 'Webhook de notificación de devolución Transfermóvil' })
  @ApiHeader({ name: 'x-tm-secret', required: true, description: 'Secreto compartido PAYMENTS_WEBHOOK_SECRET para validar webhook' })
  @ApiBody({ type: TmRefundWebhookNotificationDto })
  @ApiResponse({ status: 200, description: 'Notificación de devolución procesada', type: WebhookResponseDto })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async tmRefundWebhook(
    @Body() notification: TmRefundWebhookNotificationDto,
    @Headers('x-tm-secret') secret: string,
  ) {
    const expected = process.env.PAYMENTS_WEBHOOK_SECRET;
    if (!expected || secret !== expected) {
      throw new HttpException('Invalid webhook secret', HttpStatus.UNAUTHORIZED);
    }

    await this.tmService.handleRefundNotification(notification as any);
    return { success: true };
  }
}