"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
const QRCode = __importStar(require("qrcode"));
const uuid_1 = require("uuid");
let PaymentsService = class PaymentsService {
    get supabase() {
        return (0, supabase_1.getSupabaseAdmin)();
    }
    async createOrder(dto) {
        const { data: plan, error: planError } = await this.supabase
            .from('plans')
            .select('*')
            .eq('id', dto.plan_id)
            .single();
        if (planError || !plan)
            throw new common_1.NotFoundException('Plan not found');
        if (plan.is_enterprise)
            throw new common_1.BadRequestException('Enterprise plans require contacting sales');
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
        if (subError)
            throw subError;
        const transactionRef = `TXN-${(0, uuid_1.v4)().split('-')[0].toUpperCase()}`;
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
        if (payError)
            throw payError;
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
        await this.supabase
            .from('payments')
            .update({ qr_code_data: qrCodeBase64 })
            .eq('id', payment.id);
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
    async getPaymentStatus(paymentId) {
        const { data, error } = await this.supabase
            .from('payments')
            .select('*, plans(*)')
            .eq('id', paymentId)
            .single();
        if (error)
            throw new common_1.NotFoundException('Payment not found');
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
        if (error)
            throw error;
        return { data, total: count, page, limit };
    }
    async confirmPayment(paymentId) {
        const { data: payment, error: fetchError } = await this.supabase
            .from('payments')
            .select('*')
            .eq('id', paymentId)
            .single();
        if (fetchError || !payment)
            throw new common_1.NotFoundException('Payment not found');
        await this.supabase
            .from('payments')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', paymentId);
        await this.supabase
            .from('subscriptions')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', payment.subscription_id);
        await this.supabase.from('event_logs').insert({
            actor_id: payment.user_id,
            action: 'payment_completed',
            entity_type: 'payment',
            entity_id: paymentId,
            details: { amount: payment.amount, currency: payment.currency },
        });
        return { status: 'completed', payment_id: paymentId };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)()
], PaymentsService);
//# sourceMappingURL=payments.service.js.map