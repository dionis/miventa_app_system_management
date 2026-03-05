"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
let UsersService = class UsersService {
    get supabase() {
        return (0, supabase_1.getSupabaseAdmin)();
    }
    async findAll(page = 1, limit = 20, search) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        let query = this.supabase
            .from('profiles')
            .select('*, subscriptions(*, plans(name))', { count: 'exact' })
            .order('created_at', { ascending: false });
        if (search) {
            query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
        }
        const { data, error, count } = await query.range(from, to);
        if (error)
            throw error;
        const enrichedData = await Promise.all((data || []).map(async (profile) => {
            const { data: { user } } = await this.supabase.auth.admin.getUserById(profile.id);
            return { ...profile, email: user?.email };
        }));
        return { data: enrichedData, total: count, page, limit };
    }
    async findOne(id) {
        const { data: profile, error } = await this.supabase
            .from('profiles')
            .select('*, subscriptions(*, plans(name))')
            .eq('id', id)
            .single();
        if (error)
            throw error;
        const { data: { user } } = await this.supabase.auth.admin.getUserById(id);
        return { ...profile, email: user?.email };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map