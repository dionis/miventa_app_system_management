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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
const QRCode = __importStar(require("qrcode"));
const uuid_1 = require("uuid");
const qr_sign_util_1 = require("./qr-sign.util");
const licenses_service_1 = require("../licenses/licenses.service");
let PaymentsService = class PaymentsService {
    licenses;
    constructor(licenses) {
        this.licenses = licenses;
    }
    get supabase() {
        return (0, supabase_1.getSupabaseAdmin)();
    }
    async createOrder(plan_id, authUserId) {
        if (!authUserId)
            throw new common_1.ForbiddenException('Authentication required');
        const { data: plan, error: planError } = await this.supabase
            .from('plans')
            .select('*')
            .eq('id', plan_id)
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
            user_id: authUserId,
            plan_id,
            status: 'pending',
            starts_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
        })
            .select()
            .single();
        if (subError || !subscription) {
            throw (subError ?? new common_1.BadRequestException('Could not create subscription'));
        }
        const transactionRef = `TXN-${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
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
            await this.supabase
                .from('subscriptions')
                .delete()
                .eq('id', subscription.id);
            throw payError ?? new common_1.BadRequestException('Could not create payment');
        }
        const qrPayload = (0, qr_sign_util_1.signQrPayload)({
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
    async getPaymentStatus(paymentId, authUser) {
        const { data, error } = await this.supabase
            .from('payments')
            .select('*, plans(*)')
            .eq('id', paymentId)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('Payment not found');
        const role = authUser?.role;
        if (role !== 'admin' && role !== 'staff' && data.user_id !== authUser?.id) {
            throw new common_1.ForbiddenException('Not your payment');
        }
        try {
            const { data: license } = await this.supabase
                .from('licenses')
                .select('*')
                .eq('payment_id', paymentId)
                .maybeSingle();
            return { ...data, license: license ?? null };
        }
        catch {
            return data;
        }
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
        try {
            const { data: existing } = await this.supabase
                .from('licenses')
                .select('*')
                .eq('payment_id', paymentId)
                .maybeSingle();
            if (existing) {
                return {
                    status: 'completed',
                    payment_id: paymentId,
                    license_key: existing.license_key,
                    license: existing,
                    reused: true,
                };
            }
        }
        catch {
        }
        const { data: plan } = await this.supabase
            .from('plans')
            .select('*')
            .eq('id', payment.plan_id)
            .maybeSingle();
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
        try {
            const license = await this.licenses.issueForPayment(payment, plan);
            return {
                status: 'completed',
                payment_id: paymentId,
                license_key: license?.license_key ?? null,
                license,
            };
        }
        catch (e) {
            return { status: 'completed', payment_id: paymentId, license_key: null, licenseError: 'license-pending' };
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [licenses_service_1.LicensesService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map