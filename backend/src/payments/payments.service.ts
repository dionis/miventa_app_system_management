import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { getSupabaseAdmin } from '../config/supabase';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { signQrPayload } from './qr-sign.util';

@Injectable()
export class PaymentsService {
  private get supabase() {
    return getSupabaseAdmin();
  }

  async createOrder(plan_id: string, authUserId: string) {
    if (!authUserId) throw new ForbiddenException('Authentication required');
    // 1. Fetch the plan
    const { data: plan, error: planError } = await this.supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) throw new NotFoundException('Plan not found');
    if (plan.is_enterprise)
      throw new BadRequestException(
        'Enterprise plans require contacting sales',
      );

    // 2. Create a subscription record
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + plan.duration_months);

    const { data: subscription, error: subError } = await this.supabase
      .from('subscriptions')
      .insert({
        user_id: authUserId,
        plan_id,
        status: 'pending',
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (subError || !subscription) {
      // No leaked: GlobalExceptionFilter sanitiza; aquí lanzamos genérico si no es Http
      throw (
        subError ?? new BadRequestException('Could not create subscription')
      );
    }

    // 3. Create a pending payment record (monto SIEMPRE desde el plan en servidor)
    const transactionRef = `TXN-${uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase()}`;

    const { data: payment, error: payError } = await this.supabase
      .from('payments')
      .insert({
        user_id: authUserId,
        subscription_id: subscription.id,
        plan_id,
        amount: plan.price,
        currency: plan.currency,
        status: 'pending',
        transaction_ref: transactionRef,
        payment_method: 'qr_code',
      })
      .select()
      .single();

    if (payError || !payment) {
      // Compensación mínima P0: evitar suscripción huérfana si falla el pago
      await this.supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscription.id);
      throw payError ?? new BadRequestException('Could not create payment');
    }

    // 4. Generate SIGNED QR code (P1: HMAC-SHA256 anti-manipulación)
    const qrPayload = signQrPayload({
      transaction_ref: transactionRef,
      amount: plan.price,
      currency: plan.currency,
      plan: plan.name,
      payment_id: payment.id,
    });

    const qrCodeBase64 = await QRCode.toDataURL(qrPayload, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    });

    // 5. Store QR data in payment record
    await this.supabase
      .from('payments')
      .update({ qr_code_data: qrCodeBase64 })
      .eq('id', payment.id);

    // 6. Log the event
    await this.supabase.from('event_logs').insert({
      actor_id: authUserId,
      action: 'payment_initiated',
      entity_type: 'payment',
      entity_id: payment.id,
      details: {
        plan_name: plan.name,
        amount: plan.price,
        transaction_ref: transactionRef,
      },
    });

    return {
      payment_id: payment.id,
      transaction_ref: transactionRef,
      amount: plan.price,
      currency: plan.currency,
      plan_name: plan.name,
      qr_code: qrCodeBase64,
      status: 'pending',
    };
  }

  async getPaymentStatus(paymentId: string, authUser?: any) {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*, plans(*)')
      .eq('id', paymentId)
      .single();

    if (error || !data) throw new NotFoundException('Payment not found');
    // Dueño o staff/admin. El rol del JWT es de conveniencia; RolesGuard ya
    // protege listados, aquí aplicamos ownership.
    const role = authUser?.role;
    if (role !== 'admin' && role !== 'staff' && data.user_id !== authUser?.id) {
      throw new ForbiddenException('Not your payment');
    }
    return data;
  }

  async findAll(page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await this.supabase
      .from('payments')
      .select('*, plans(name), profiles(full_name, role)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, total: count, page, limit };
  }

  // Placeholder: Webhook/callback for payment confirmation
  async confirmPayment(paymentId: string) {
    const { data: payment, error: fetchError } = await this.supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment)
      throw new NotFoundException('Payment not found');

    // Update payment status
    await this.supabase
      .from('payments')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', paymentId);

    // Activate the subscription
    await this.supabase
      .from('subscriptions')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', payment.subscription_id);

    // Log the event
    await this.supabase.from('event_logs').insert({
      actor_id: payment.user_id,
      action: 'payment_completed',
      entity_type: 'payment',
      entity_id: paymentId,
      details: { amount: payment.amount, currency: payment.currency },
    });

    return { status: 'completed', payment_id: paymentId };
  }
}
