"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
let ReferralsService = class ReferralsService {
    get supabase() {
        return (0, supabase_1.getSupabaseAdmin)();
    }
    generateReferralCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'REF-';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    async create(dto) {
        const referralCode = this.generateReferralCode();
        const { data, error } = await this.supabase
            .from('referrers')
            .insert({
            full_name: dto.full_name,
            email: dto.email,
            phone: dto.phone,
            bank_account_number: dto.bank_account_number,
            bank_name: dto.bank_name,
            referral_code: referralCode,
        })
            .select()
            .single();
        if (error)
            throw error;
        await this.supabase.from('event_logs').insert({
            action: 'referrer_created',
            entity_type: 'referrer',
            entity_id: data.id,
            details: { full_name: dto.full_name, referral_code: referralCode },
        });
        return data;
    }
    async findAll(page = 1, limit = 20, search) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        let query = this.supabase
            .from('referrers')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });
        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,referral_code.ilike.%${search}%`);
        }
        const { data, error, count } = await query.range(from, to);
        if (error)
            throw error;
        return { data, total: count, page, limit };
    }
    async findOne(id) {
        const { data, error } = await this.supabase
            .from('referrers')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw new common_1.NotFoundException('Referrer not found');
        return data;
    }
    async update(id, dto) {
        const { data, error } = await this.supabase
            .from('referrers')
            .update({ ...dto, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        await this.supabase.from('event_logs').insert({
            action: 'referrer_updated',
            entity_type: 'referrer',
            entity_id: id,
            details: dto,
        });
        return data;
    }
    async remove(id) {
        const { error } = await this.supabase
            .from('referrers')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        await this.supabase.from('event_logs').insert({
            action: 'referrer_deleted',
            entity_type: 'referrer',
            entity_id: id,
        });
        return { deleted: true };
    }
    async getConfig() {
        const defaults = { referral_discount_percent: 10, referral_commission_percent: 10 };
        try {
            const { data } = await this.supabase.from('app_settings').select('key, value').in('key', [
                'referral_discount_percent',
                'referral_commission_percent',
            ]);
            const map = {};
            for (const row of data ?? [])
                map[row.key] = row.value;
            return {
                referral_discount_percent: Number(map['referral_discount_percent'] ?? defaults.referral_discount_percent),
                referral_commission_percent: Number(map['referral_commission_percent'] ?? defaults.referral_commission_percent),
            };
        }
        catch {
            return defaults;
        }
    }
    async updateConfig(dto) {
        const out = {};
        if (dto.referral_discount_percent !== undefined) {
            const v = Number(dto.referral_discount_percent);
            if (!Number.isFinite(v) || v < 0 || v > 90)
                throw new common_1.BadRequestException('referral_discount_percent must be 0..90');
            out['referral_discount_percent'] = v;
        }
        if (dto.referral_commission_percent !== undefined) {
            const v = Number(dto.referral_commission_percent);
            if (!Number.isFinite(v) || v < 0 || v > 100)
                throw new common_1.BadRequestException('referral_commission_percent must be 0..100');
            out['referral_commission_percent'] = v;
        }
        if (Object.keys(out).length === 0)
            throw new common_1.BadRequestException('Nothing to update');
        for (const [key, value] of Object.entries(out)) {
            await this.supabase.from('app_settings').upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' });
        }
        await this.supabase.from('event_logs').insert({
            action: 'referral_config_updated',
            entity_type: 'app_settings',
            details: out,
        });
        return this.getConfig();
    }
    async validateCode(raw) {
        const code = String(raw ?? '').trim().toUpperCase();
        if (!code)
            throw new common_1.BadRequestException('referral_code required');
        const { data, error } = await this.supabase
            .from('referrers')
            .select('id, full_name, referral_code, is_active')
            .eq('referral_code', code)
            .maybeSingle();
        if (error || !data || !data.is_active)
            throw new common_1.BadRequestException('Invalid referral code');
        const cfg = await this.getConfig();
        return {
            valid: true,
            referral_code: data.referral_code,
            referrer_name: data.full_name,
            discount_percent: cfg.referral_discount_percent,
        };
    }
};
exports.ReferralsService = ReferralsService;
exports.ReferralsService = ReferralsService = __decorate([
    (0, common_1.Injectable)()
], ReferralsService);
//# sourceMappingURL=referrals.service.js.map