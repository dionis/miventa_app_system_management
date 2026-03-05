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
};
exports.ReferralsService = ReferralsService;
exports.ReferralsService = ReferralsService = __decorate([
    (0, common_1.Injectable)()
], ReferralsService);
//# sourceMappingURL=referrals.service.js.map