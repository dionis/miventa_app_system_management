"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
let LogsService = class LogsService {
    get supabase() {
        return (0, supabase_1.getSupabaseAdmin)();
    }
    async findAll(page = 1, limit = 50, entityType) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        let query = this.supabase
            .from('event_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });
        if (entityType) {
            query = query.eq('entity_type', entityType);
        }
        const { data, error, count } = await query.range(from, to);
        if (error)
            throw error;
        return { data, total: count, page, limit };
    }
};
exports.LogsService = LogsService;
exports.LogsService = LogsService = __decorate([
    (0, common_1.Injectable)()
], LogsService);
//# sourceMappingURL=logs.service.js.map