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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
const QRCode = __importStar(require("qrcode"));
const uuid_1 = require("uuid");
const node_crypto_1 = require("node:crypto");
const bcrypt = __importStar(require("bcrypt"));
const qr_sign_util_1 = require("./qr-sign.util");
const licenses_service_1 = require("../licenses/licenses.service");
const mail_service_1 = require("../licenses/mail.service");
const sms_service_1 = require("../notify/sms.service");
const dashboard_service_1 = require("../dashboard/dashboard.service");
function round2(n) {
    return Math.round(Number(n) * 100) / 100;
}
let PaymentsService = PaymentsService_1 = class PaymentsService {
    licenses;
    licenseMail;
    sms;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(licenses, licenseMail, sms) {
        this.licenses = licenses;
        this.licenseMail = licenseMail;
        this.sms = sms;
    }
    get supabase() {
        return (0, supabase_1.getSupabaseAdmin)();
    }
    async getReferralConfig() {
        try {
            const { data } = await this.supabase
                .from('app_settings')
                .select('key, value')
                .in('key', ['referral_discount_percent', 'referral_commission_percent']);
            const map = {};
            for (const r of (data ?? []))
                map[r.key] = r.value;
            return {
                discount: Number(map['referral_discount_percent'] ?? 10),
                commission: Number(map['referral_commission_percent'] ?? 10),
            };
        }
        catch {
            return { discount: 10, commission: 10 };
        }
    }
    async findReferrer(code) {
        const c = String(code ?? '').trim().toUpperCase();
        if (!c)
            return null;
        const { data } = await this.supabase
            .from('referrers')
            .select('id, referral_code, is_active')
            .eq('referral_code', c)
            .maybeSingle();
        if (!data || !data.is_active) {
            throw new common_1.BadRequestException('Invalid referral code');
        }
        return data;
    }
    newClaimToken() {
        return (0, node_crypto_1.randomBytes)(32).toString('hex');
    }
    async buildOrder(args) {
        const { data: plan, error: planError } = await this.supabase
            .from('plans')
            .select('*')
            .eq('id', args.plan_id)
            .single();
        if (planError || !plan)
            throw new common_1.NotFoundException('Plan not found');
        if (plan.is_enterprise)
            throw new common_1.BadRequestException('Enterprise plans require contacting sales');
        const email = args.email?.trim().toLowerCase() || null;
        const phone = args.phone?.trim() || null;
        const wantsNone = String(args.channel) === 'none';
        if (!args.userId && !email && !phone && !wantsNone) {
            throw new common_1.BadRequestException('Email or phone required for guest checkout');
        }
        const channel = ['email', 'sms', 'both', 'none'].includes(String(args.channel))
            ? String(args.channel)
            : email && phone
                ? 'both'
                : phone && !email
                    ? 'sms'
                    : 'email';
        if (channel !== 'sms' && channel !== 'none' && !email && args.userId == null) {
            throw new common_1.BadRequestException('Email required for email notifications');
        }
        let referrer = null;
        let discountPercent = 0;
        if (args.referral_code) {
            referrer = await this.findReferrer(args.referral_code);
            const cfg = await this.getReferralConfig();
            discountPercent = Math.min(Math.max(Number(cfg.discount) || 0, 0), 90);
        }
        const original = round2(Number(plan.price));
        const amount = round2(original * (1 - discountPercent / 100));
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + plan.duration_months);
        const { data: subscription, error: subError } = await this.supabase
            .from('subscriptions')
            .insert({
            user_id: args.userId,
            plan_id: args.plan_id,
            status: 'pending',
            starts_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
        })
            .select()
            .single();
        if (subError || !subscription) {
            throw subError ?? new common_1.BadRequestException('Could not create subscription');
        }
        const transactionRef = `TXN-${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
        const claimToken = this.newClaimToken();
        const { data: payment, error: payError } = await this.supabase
            .from('payments')
            .insert({
            user_id: args.userId,
            subscription_id: subscription.id,
            plan_id: args.plan_id,
            amount,
            amount_original: original,
            discount_percent: discountPercent,
            currency: plan.currency,
            status: 'pending',
            transaction_ref: transactionRef,
            payment_method: 'qr_code',
            guest_email: email,
            guest_phone: phone,
            contact_channel: channel,
            claim_token: claimToken,
            referral_code: referrer ? referrer.referral_code : (args.referral_code?.trim().toUpperCase() ?? null),
            referrer_id: referrer ? referrer.id : null,
        })
            .select()
            .single();
        if (payError || !payment) {
            await this.supabase.from('subscriptions').delete().eq('id', subscription.id);
            throw payError ?? new common_1.BadRequestException('Could not create payment');
        }
        const qrPayload = (0, qr_sign_util_1.signQrPayload)({
            transaction_ref: transactionRef,
            amount,
            currency: plan.currency,
            plan: plan.name,
            payment_id: payment.id,
        });
        const qrCodeBase64 = await QRCode.toDataURL(qrPayload, {
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' },
        });
        await this.supabase.from('payments').update({ qr_code_data: qrCodeBase64 }).eq('id', payment.id);
        await this.supabase.from('event_logs').insert({
            actor_id: args.userId,
            action: 'payment_initiated',
            entity_type: 'payment',
            entity_id: payment.id,
            details: {
                plan_name: plan.name,
                amount,
                amount_original: original,
                discount_percent: discountPercent,
                referral_code: referrer?.referral_code ?? null,
                guest: !args.userId,
                transaction_ref: transactionRef,
            },
        });
        return {
            payment_id: payment.id,
            claim_token: claimToken,
            transaction_ref: transactionRef,
            amount,
            amount_original: original,
            discount_percent: discountPercent,
            currency: plan.currency,
            plan_name: plan.name,
            qr_code: qrCodeBase64,
            status: 'pending',
        };
    }
    async createOrder(plan_id, authUserId, opts) {
        if (!authUserId)
            throw new common_1.ForbiddenException('Authentication required');
        return this.buildOrder({ plan_id, userId: authUserId, referral_code: opts?.referral_code, channel: opts?.contact_channel });
    }
    async createGuestOrder(dto) {
        return this.buildOrder({
            plan_id: dto.plan_id,
            userId: null,
            email: dto.email,
            phone: dto.phone,
            channel: dto.contact_channel,
            referral_code: dto.referral_code,
        });
    }
    checkClaim(payment, claim) {
        if (!claim || payment.claim_token == null)
            return false;
        try {
            const a = Buffer.from(String(claim));
            const b = Buffer.from(String(payment.claim_token));
            if (a.length !== b.length)
                return false;
            const { timingSafeEqual } = require('node:crypto');
            return timingSafeEqual(a, b);
        }
        catch {
            return payment.claim_token === claim;
        }
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
    async getPublicStatus(paymentId, claim) {
        const { data, error } = await this.supabase
            .from('payments')
            .select('*, plans(name)')
            .eq('id', paymentId)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('Payment not found');
        if (!this.checkClaim(data, claim))
            throw new common_1.ForbiddenException('Invalid claim token');
        let license = null;
        try {
            const r = await this.supabase.from('licenses').select('*').eq('payment_id', paymentId).maybeSingle();
            license = r.data ?? null;
        }
        catch {
            license = null;
        }
        const { claim_token: _omit, qr_code_data: _qr, ...safe } = data;
        return {
            ...safe,
            payment_id: data.id,
            status: data.status,
            amount: data.amount,
            amount_original: data.amount_original,
            discount_percent: data.discount_percent,
            currency: data.currency,
            transaction_ref: data.transaction_ref,
            referral_code: data.referral_code,
            license,
        };
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
    async ensureUserForPayment(payment) {
        if (payment.user_id)
            return payment.user_id;
        const email = payment.guest_email?.trim().toLowerCase() || null;
        if (!email)
            return null;
        const { data: existing } = await this.supabase.from('profiles').select('id').eq('email', email).maybeSingle();
        if (existing)
            return existing.id;
        const randomPass = (0, node_crypto_1.randomBytes)(24).toString('hex');
        const password_hash = await bcrypt.hash(randomPass, 10);
        const fullName = email.split('@')[0].replace(/[._-]+/g, ' ').trim() || 'Cliente MiVenta';
        const { data: created, error } = await this.supabase
            .from('profiles')
            .insert({
            email,
            password_hash,
            full_name: fullName,
            phone: payment.guest_phone ?? null,
            role: 'customer',
            referral_code_used: payment.referral_code ?? null,
        })
            .select('id')
            .single();
        if (error) {
            const retry = await this.supabase.from('profiles').select('id').eq('email', email).maybeSingle();
            if (retry.data)
                return retry.data.id;
            throw error;
        }
        await this.supabase.from('event_logs').insert({
            actor_id: created.id,
            action: 'user_auto_registered',
            entity_type: 'profile',
            entity_id: created.id,
            details: { via: 'guest_payment', payment_id: payment.id },
        });
        return created.id;
    }
    async confirmPayment(paymentId) {
        const { data: payment, error: fetchError } = await this.supabase
            .from('payments')
            .select('*')
            .eq('id', paymentId)
            .single();
        if (fetchError || !payment)
            throw new common_1.NotFoundException('Payment not found');
        const wasGuest = !payment.user_id;
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
        let userId = payment.user_id;
        try {
            const ensured = await this.ensureUserForPayment(payment);
            if (ensured && ensured !== userId) {
                userId = ensured;
                await this.supabase.from('payments').update({ user_id: ensured }).eq('id', paymentId);
                if (payment.subscription_id) {
                    await this.supabase.from('subscriptions').update({ user_id: ensured }).eq('id', payment.subscription_id);
                }
                payment.user_id = ensured;
            }
        }
        catch {
        }
        await this.supabase
            .from('payments')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', paymentId);
        if (payment.subscription_id) {
            await this.supabase
                .from('subscriptions')
                .update({ status: 'active', updated_at: new Date().toISOString() })
                .eq('id', payment.subscription_id);
        }
        await this.supabase.from('event_logs').insert({
            actor_id: userId,
            action: 'payment_completed',
            entity_type: 'payment',
            entity_id: paymentId,
            details: {
                amount: payment.amount,
                currency: payment.currency,
                referral_code: payment.referral_code,
                guest: !payment.user_id && !userId ? true : !payment.user_id,
            },
        });
        try {
            if (payment.referrer_id) {
                const cfg = await this.getReferralConfig();
                const commission = round2(Number(payment.amount) * (Number(cfg.commission) || 0) / 100);
                await this.supabase.from('payments').update({ commission_amount: commission }).eq('id', paymentId);
                const { data: already } = await this.supabase
                    .from('referral_uses')
                    .select('id')
                    .eq('payment_id', paymentId)
                    .maybeSingle();
                if (!already) {
                    await this.supabase.from('referral_uses').insert({
                        referrer_id: payment.referrer_id,
                        payment_id: paymentId,
                        buyer_email: payment.guest_email,
                        buyer_phone: payment.guest_phone,
                        discount_percent: payment.discount_percent ?? 0,
                        commission_amount: commission,
                    });
                    const { data: ref } = await this.supabase
                        .from('referrers')
                        .select('total_referrals, total_earnings')
                        .eq('id', payment.referrer_id)
                        .single();
                    if (ref) {
                        await this.supabase
                            .from('referrers')
                            .update({
                            total_referrals: Number(ref.total_referrals ?? 0) + 1,
                            total_earnings: round2(Number(ref.total_earnings ?? 0) + commission),
                            updated_at: new Date().toISOString(),
                        })
                            .eq('id', payment.referrer_id);
                    }
                    await this.supabase.from('event_logs').insert({
                        actor_id: userId,
                        action: 'referral_paid',
                        entity_type: 'payment',
                        entity_id: paymentId,
                        details: {
                            referrer_id: payment.referrer_id,
                            referral_code: payment.referral_code,
                            commission_amount: commission,
                        },
                    });
                }
            }
        }
        catch {
        }
        let license = null;
        try {
            license = await this.licenses.issueForPayment({ ...payment, user_id: userId }, plan);
        }
        catch (e) {
            this.logger.error(`license issue failed for payment ${paymentId}: ${e?.message ?? e}`);
            (0, dashboard_service_1.invalidateDashboardCache)();
            return {
                status: 'completed',
                payment_id: paymentId,
                license_key: null,
                licenseError: 'license-pending',
                licenseReason: e?.message ?? String(e),
                user_id: userId,
            };
        }
        try {
            await this.notifyBuyer(paymentId, {}, true);
        }
        catch {
        }
        (0, dashboard_service_1.invalidateDashboardCache)();
        return {
            status: 'completed',
            payment_id: paymentId,
            license_key: license?.license_key ?? null,
            license,
            user_id: userId,
            account_created: wasGuest && !!userId,
        };
    }
    async notifyBuyer(paymentId, opts, internal = false) {
        const { data: payment, error } = await this.supabase.from('payments').select('*').eq('id', paymentId).single();
        if (error || !payment)
            throw new common_1.NotFoundException('Payment not found');
        if (!internal) {
            if (payment.claim_token) {
                if (!this.checkClaim(payment, opts.claim))
                    throw new common_1.ForbiddenException('Invalid claim token');
            }
            else if (!payment.user_id) {
                throw new common_1.ForbiddenException('Invalid claim token');
            }
        }
        const updates = {};
        if (opts.email?.includes('@'))
            updates.guest_email = opts.email.trim().toLowerCase();
        if (opts.phone?.trim())
            updates.guest_phone = opts.phone.trim();
        if (opts.channel && ['email', 'sms', 'both', 'none'].includes(opts.channel))
            updates.contact_channel = opts.channel;
        if (Object.keys(updates).length) {
            await this.supabase.from('payments').update(updates).eq('id', paymentId);
            Object.assign(payment, updates);
        }
        const license = await this.licenses.findByPayment(paymentId);
        if (!license)
            throw new common_1.BadRequestException('License not ready yet');
        const toEmail = payment.guest_email || (await this.licenses.resolvePaymentEmail(paymentId, payment.user_id));
        const toPhone = payment.guest_phone || null;
        const channel = payment.contact_channel || 'email';
        if (channel === 'none') {
            return { emailed: false, smsSent: false, toEmail: toEmail ?? null, toPhone: toPhone ?? null, channel, emailReason: 'channel-none', smsReason: 'channel-none' };
        }
        let emailed = false;
        let smsSent = false;
        let emailReason;
        let smsReason;
        if ((channel === 'email' || channel === 'both') && toEmail) {
            const r = await this.licenseMail.sendLicenseEmail(toEmail, license.license_key, {});
            emailed = r.emailed;
            emailReason = r.reason;
            if (emailed) {
                await this.supabase.from('licenses').update({ emailed_at: new Date().toISOString() }).eq('id', license.id);
            }
        }
        if ((channel === 'sms' || channel === 'both') && toPhone) {
            const r = await this.sms.sendSms(toPhone, `MiVenta: tu llave es ${license.license_key}`);
            smsSent = r.sent;
            smsReason = r.reason;
        }
        return { emailed, smsSent, toEmail: toEmail ?? null, toPhone: toPhone ?? null, channel, emailReason, smsReason };
    }
    async updateContact(paymentId, dto) {
        const { data: payment, error } = await this.supabase
            .from('payments')
            .select('*')
            .eq('id', paymentId)
            .single();
        if (error || !payment)
            throw new common_1.NotFoundException('Payment not found');
        if (!this.checkClaim(payment, dto.claim))
            throw new common_1.ForbiddenException('Invalid claim token');
        if (payment.status !== 'pending') {
            throw new common_1.BadRequestException('Payment already processed, contact can no longer be edited');
        }
        const channel = dto.channel ?? payment.contact_channel ?? 'email';
        if (!['email', 'sms', 'both', 'none'].includes(channel)) {
            throw new common_1.BadRequestException('Invalid channel');
        }
        const email = dto.email !== undefined ? dto.email.trim().toLowerCase() || null : payment.guest_email;
        const phone = dto.phone !== undefined ? dto.phone.trim() || null : payment.guest_phone;
        if (channel !== 'none' && !payment.user_id && !email && !phone) {
            throw new common_1.BadRequestException('Email or phone required for guest checkout');
        }
        if (channel !== 'sms' && channel !== 'none' && !email && !payment.user_id) {
            throw new common_1.BadRequestException('Email required for email notifications');
        }
        const { data: updated, error: upErr } = await this.supabase
            .from('payments')
            .update({
            guest_email: email,
            guest_phone: phone,
            contact_channel: channel,
            updated_at: new Date().toISOString(),
        })
            .eq('id', paymentId)
            .select('id, status, guest_email, guest_phone, contact_channel, referral_code, discount_percent, amount, amount_original, currency, transaction_ref')
            .single();
        if (upErr)
            throw upErr;
        return updated;
    }
    async simulatePayment(paymentId, claim) {
        if (String(process.env.PAYMENT_SIMULATION_ENABLED ?? 'true').toLowerCase() === 'false') {
            throw new common_1.ForbiddenException('Simulation disabled');
        }
        const { data: payment, error } = await this.supabase
            .from('payments')
            .select('id, status, claim_token')
            .eq('id', paymentId)
            .single();
        if (error || !payment)
            throw new common_1.NotFoundException('Payment not found');
        if (!this.checkClaim(payment, claim))
            throw new common_1.ForbiddenException('Invalid claim token');
        if (payment.status !== 'pending') {
            throw new common_1.BadRequestException('Payment already processed');
        }
        await this.supabase.from('event_logs').insert({
            action: 'payment_simulated',
            entity_type: 'payment',
            entity_id: paymentId,
            details: { via: 'simulate-button' },
        });
        return this.confirmPayment(paymentId);
    }
    async claimAccount(paymentId, dto) {
        const { data: payment, error } = await this.supabase.from('payments').select('*').eq('id', paymentId).single();
        if (error || !payment)
            throw new common_1.NotFoundException('Payment not found');
        if (!this.checkClaim(payment, dto.claim))
            throw new common_1.ForbiddenException('Invalid claim token');
        if (!payment.user_id)
            throw new common_1.BadRequestException('Account not created yet (payment pending?)');
        if (!dto.password || dto.password.length < 8)
            throw new common_1.BadRequestException('Password min 8 chars');
        const password_hash = await bcrypt.hash(dto.password, 10);
        const upd = { password_hash, updated_at: new Date().toISOString() };
        if (dto.full_name?.trim())
            upd.full_name = dto.full_name.trim();
        await this.supabase.from('profiles').update(upd).eq('id', payment.user_id);
        await this.supabase.from('event_logs').insert({
            actor_id: payment.user_id,
            action: 'account_claimed',
            entity_type: 'payment',
            entity_id: paymentId,
        });
        return { claimed: true };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [licenses_service_1.LicensesService,
        mail_service_1.LicenseMailService,
        sms_service_1.SmsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map