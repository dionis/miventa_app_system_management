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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
const bcrypt = __importStar(require("bcrypt"));
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
            query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
        }
        const { data, error, count } = await query.range(from, to);
        if (error)
            throw error;
        const cleanData = (data || []).map(({ password_hash, ...rest }) => rest);
        return { data: cleanData, total: count, page, limit };
    }
    async findOne(id) {
        const { data: profile, error } = await this.supabase
            .from('profiles')
            .select('*, subscriptions(*, plans(name))')
            .eq('id', id)
            .single();
        if (error)
            throw error;
        const { password_hash, ...cleanProfile } = profile;
        return cleanProfile;
    }
    async findByEmail(email) {
        const { data: profile, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();
        if (error && error.code !== 'PGRST116')
            throw error;
        return profile;
    }
    async create(userData) {
        const { email, password, full_name, phone } = userData;
        const password_hash = await bcrypt.hash(password, 10);
        const { data, error } = await this.supabase
            .from('profiles')
            .insert([{ email, password_hash, full_name, phone }])
            .select()
            .single();
        if (error)
            throw error;
        const { password_hash: _hash, ...cleanProfile } = data;
        return cleanProfile;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map