"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
let LeadsService = class LeadsService {
    get supabase() {
        return (0, supabase_1.getSupabaseAdmin)();
    }
    async create(dto) {
        const { data, error } = await this.supabase
            .from('leads')
            .insert({
            full_name: dto.full_name,
            email: dto.email,
            phone: dto.phone,
            company: dto.company,
            message: dto.message,
            source: 'contact_form',
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async findAll(page = 1, limit = 20) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        const { data, error, count } = await this.supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);
        if (error)
            throw error;
        return { data, total: count, page, limit };
    }
    async markAsRead(id) {
        const { data, error } = await this.supabase
            .from('leads')
            .update({ is_read: true })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)()
], LeadsService);
//# sourceMappingURL=leads.service.js.map