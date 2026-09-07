"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaqsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
let FaqsService = class FaqsService {
    get supabase() {
        return (0, supabase_1.getSupabaseAdmin)();
    }
    async findAllPublished() {
        const { data, error } = await this.supabase
            .from('faqs')
            .select('*')
            .eq('is_published', true)
            .order('sort_order', { ascending: true });
        if (error)
            throw error;
        return data;
    }
    async findAll() {
        const { data, error } = await this.supabase
            .from('faqs')
            .select('*')
            .order('sort_order', { ascending: true });
        if (error)
            throw error;
        return data;
    }
    async create(dto) {
        const { data, error } = await this.supabase
            .from('faqs')
            .insert(dto)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async update(id, dto) {
        const { data, error } = await this.supabase
            .from('faqs')
            .update({ ...dto, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new common_1.NotFoundException('FAQ not found');
        return data;
    }
    async remove(id) {
        const { error } = await this.supabase.from('faqs').delete().eq('id', id);
        if (error)
            throw error;
        return { deleted: true };
    }
};
exports.FaqsService = FaqsService;
exports.FaqsService = FaqsService = __decorate([
    (0, common_1.Injectable)()
], FaqsService);
//# sourceMappingURL=faqs.service.js.map