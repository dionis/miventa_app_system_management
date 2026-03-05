"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
let DashboardService = class DashboardService {
    get supabase() {
        return (0, supabase_1.getSupabaseAdmin)();
    }
    async getStats() {
        const { data: salesData } = await this.supabase
            .from('payments')
            .select('amount')
            .eq('status', 'completed');
        const totalSales = (salesData || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const totalTransactions = salesData?.length || 0;
        const { count: activeSubscriptions } = await this.supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');
        const { count: totalUsers } = await this.supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        const { count: activeReferrers } = await this.supabase
            .from('referrers')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);
        const { data: referralData } = await this.supabase
            .from('referrers')
            .select('total_referrals');
        const totalReferrals = (referralData || []).reduce((sum, r) => sum + r.total_referrals, 0);
        const { count: pendingPayments } = await this.supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        const { count: unreadLeads } = await this.supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false);
        const monthlySales = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();
            const { data: monthData } = await this.supabase
                .from('payments')
                .select('amount')
                .eq('status', 'completed')
                .gte('created_at', startOfMonth)
                .lte('created_at', endOfMonth);
            monthlySales.push({
                month: date.toLocaleString('en', { month: 'short' }),
                sales: (monthData || []).reduce((sum, p) => sum + parseFloat(p.amount), 0),
                transactions: monthData?.length || 0,
            });
        }
        return {
            totalSales,
            totalTransactions,
            activeSubscriptions: activeSubscriptions || 0,
            totalUsers: totalUsers || 0,
            activeReferrers: activeReferrers || 0,
            totalReferrals,
            pendingPayments: pendingPayments || 0,
            unreadLeads: unreadLeads || 0,
            monthlySales,
        };
    }
    async getPlans() {
        const { data, error } = await this.supabase
            .from('plans')
            .select('*')
            .eq('is_active', true)
            .order('duration_months', { ascending: true });
        if (error)
            throw error;
        return data;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)()
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map