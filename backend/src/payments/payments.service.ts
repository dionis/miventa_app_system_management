import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { getSupabaseAdmin } from '../config/supabase';
import { CreateOrderDto } from './dto/create-order.dto';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
    private get supabase() {
        return getSupabaseAdmin();
    }

    async createOrder(dto: CreateOrderDto) {
        // 1. Fetch the plan
        const { data: plan, error: planError } = await this.supabase
            .from('plans')
            .select('*')
            .eq('id', dto.plan_id)
            .single();

        if (planError || !plan) throw new NotFoundException('Plan not found');
        if (plan.is_enterprise) throw new BadRequestException('Enterprise plans require contacting sales');

        // 2. Create a subscription record
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + plan.duration_months);

        const { data: subscription, error: subError } = await this.supabase
            .from('subscriptions')
            .insert({
                user_id: dto.user_id,
                plan_id: dto.plan_id,
                status: 'pending',
                starts_at: now.toISOString(),
                expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

        if (subError) throw subError;

        // 3. Create a pending payment record
        const transactionRef = `TXN-${uuidv4().split('-')[0].toUpperCase()}`;

        const { data: payment, error: payError } = await this.supabase
            .from('payments')
            .insert({
                user_id: dto.user_id,
                subscription_id: subscription.id,
                plan_id: dto.plan_id,
                amount: plan.price,
                currency: plan.currency,
                status: 'pending',
                transaction_ref: transactionRef,
                payment_method: 'qr_code',
            })
            .select()
            .single();

        if (payError) throw payError;

        // 4. Generate QR code with payment data
        const qrPayload = JSON.stringify({
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
            actor_id: dto.user_id,
            action: 'payment_initiated',
            entity_type: 'payment',
            entity_id: payment.id,
            details: { plan_name: plan.name, amount: plan.price, transaction_ref: transactionRef },
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

    async getPaymentStatus(paymentId: string) {
        const { data, error } = await this.supabase
            .from('payments')
            .select('*, plans(*)')
            .eq('id', paymentId)
            .single();

        if (error) throw new NotFoundException('Payment not found');
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

        if (fetchError || !payment) throw new NotFoundException('Payment not found');

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
