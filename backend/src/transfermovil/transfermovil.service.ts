import { Injectable, Logger, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TmHttpClient } from './clients/tm-http.client';
import { LicensesService } from '../licenses/licenses.service';
import { getSupabaseAdmin } from '../config/supabase';
import {
  TmWebhookNotification,
  TmRefundWebhookNotification,
  TmInitiatePaymentResponse,
} from './interfaces/tm-client.interface';

@Injectable()
export class TransfermovilService {
  private readonly logger = new Logger(TransfermovilService.name);
  private readonly supabase = getSupabaseAdmin();
  private readonly source: number;
  private readonly notifyUrl: string;

  constructor(
    private readonly tmClient: TmHttpClient,
    private readonly licensesService: LicensesService,
    private readonly configService: ConfigService,
  ) {
    this.source = Number(this.configService.get<string>('TM_WS_SOURCE') || '10');
    this.notifyUrl = this.configService.get<string>('TM_MERCHANT_NOTIFY_URL') || '';
  }

  async initiatePayment(paymentId: string): Promise<TmInitiatePaymentResponse> {
    const { data: payment, error } = await this.supabase
      .from('payments')
      .select('*, plans(*)')
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'pending') {
      throw new HttpException('Payment already processed', HttpStatus.BAD_REQUEST);
    }

    const tmResponse = await this.tmClient.initiatePayment({
      amount: Number(payment.amount),
      currency: payment.currency || 'CUP',
      description: `Plan ${(payment as any).plans?.name || payment.plan_id}`,
      externalId: payment.transaction_ref,
      source: this.source,
      notifyUrl: this.notifyUrl,
      validTime: 3600,
    });

    await this.supabase
      .from('payments')
      .update({
        tm_order_id: tmResponse.tm_order_id.toString(),
        tm_qr_code: tmResponse.qr_code,
        payment_provider: 'transfermovil',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    this.logger.log(`TM payment initiated for payment ${paymentId}, TM OrderId: ${tmResponse.tm_order_id}`);

    return tmResponse;
  }

  async handleWebhookNotification(notification: TmWebhookNotification): Promise<{ paymentId: string; action: 'confirm' | 'fail' }> {
    this.logger.log(`TM Webhook received: ExternalId=${notification.ExternalId}, Status=${notification.Status}`);

    const { data: payment } = await this.supabase
      .from('payments')
      .select('id, status')
      .eq('transaction_ref', notification.ExternalId)
      .single();

    if (!payment) {
      this.logger.warn(`Payment not found for ExternalId: ${notification.ExternalId}`);
      return { paymentId: '', action: 'fail' };
    }

    if (payment.status === 'completed') {
      this.logger.log(`Payment ${payment.id} already completed`);
      return { paymentId: payment.id, action: 'fail' };
    }

    if (notification.Status === '1') {
      return { paymentId: payment.id, action: 'confirm' };
    } else {
      await this.supabase
        .from('payments')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', payment.id);

      await this.supabase.from('event_logs').insert({
        action: 'payment_failed_tm',
        entity_type: 'payment',
        entity_id: payment.id,
        details: {
          tm_status: notification.Status,
          tm_msg: notification.Msg,
          bank_id: notification.BankId,
          tm_id: notification.TmId,
        },
      });
      return { paymentId: payment.id, action: 'fail' };
    }
  }

  async handleRefundNotification(notification: TmRefundWebhookNotification): Promise<void> {
    this.logger.log(`TM Refund Webhook: RefundID=${notification.RefundID}, Status=${notification.Status}`);

    const { data: payment } = await this.supabase
      .from('payments')
      .select('*')
      .eq('tm_order_id', notification.ReferenceRefundTM)
      .single();

    if (!payment) {
      this.logger.warn(`Payment not found for TM Refund Reference: ${notification.ReferenceRefundTM}`);
      return;
    }

    if (notification.Status === 1 && notification.Success === 'true') {
      await this.supabase
        .from('payments')
        .update({ status: 'refunded', updated_at: new Date().toISOString() })
        .eq('id', payment.id);

      if (payment.subscription_id) {
        await this.supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', payment.subscription_id);
      }

      if (payment.referrer_id) {
        await this.supabase
          .from('referrers')
          .update({
            total_referrals: Math.max(0, (await this.getReferrerTotal(payment.referrer_id)) - 1),
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.referrer_id);
      }
    }
  }

  private async getReferrerTotal(referrerId: string): Promise<number> {
    const { data } = await this.supabase
      .from('referrers')
      .select('total_referrals')
      .eq('id', referrerId)
      .single();
    return Number(data?.total_referrals || 0);
  }

  async queryStatus(paymentId: string): Promise<string> {
    const { data: payment } = await this.supabase
      .from('payments')
      .select('tm_order_id, transaction_ref')
      .eq('id', paymentId)
      .single();

    if (!payment || !payment.tm_order_id) {
      throw new NotFoundException('TM Order ID not found');
    }

    const response = await this.tmClient.getStatusOrder(payment.transaction_ref, this.source);

    if (response.GetStatusOrderResult.Success) {
      return String(response.GetStatusOrderResult.Status || '0');
    }

    throw new HttpException(
      `TM Status query failed: ${response.GetStatusOrderResult.Resultmsg}`,
      HttpStatus.BAD_GATEWAY,
    );
  }

  async requestRefund(paymentId: string, refundId: string): Promise<void> {
    const { data: payment } = await this.supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new HttpException('Only completed payments can be refunded', HttpStatus.BAD_REQUEST);
    }

    const response = await this.tmClient.refundPay({
      RefundID: refundId,
      Source: this.source,
      Code: '',
      UrlResponse: this.notifyUrl.replace('/notification', '/notification-refund'),
      Bank: 1,
    });

    if (!response.RefundPayResult.Success) {
      throw new HttpException(
        `TM Refund failed: ${response.RefundPayResult.Resultmsg}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    await this.supabase
      .from('payments')
      .update({ refund_id: refundId, status: 'refund_pending', updated_at: new Date().toISOString() })
      .eq('id', paymentId);
  }
}