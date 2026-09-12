"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
exports.invalidateDashboardCache = invalidateDashboardCache;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
const CACHE_TTL_MS = 60 * 1000;
let cache = null;
function invalidateDashboardCache() {
    cache = null;
}
let DashboardService = class DashboardService {
    get supabase() {
        return (0, supabase_1.getSupabaseAdmin)();
    }
    async getStats() {
        if (cache && Date.now() - cache.at < CACHE_TTL_MS)
            return cache.data;
        const sb = this.supabase;
        const [salesAgg, completedCount, activeSubs, totalUsers, activeReferrers, referralsAgg, licensesCount, referralUsesAgg, pendingPayments, unreadLeads,] = await Promise.all([
            sb
                .from('payments')
                .select('amount,created_at')
                .eq('status', 'completed')
                .limit(20000),
            sb
                .from('payments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed'),
            sb
                .from('subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active'),
            sb.from('profiles').select('*', { count: 'exact', head: true }),
            sb
                .from('referrers')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true),
            sb.from('referrers').select('total_referrals').limit(20000),
            sb.from('licenses').select('*', { count: 'exact', head: true }),
            sb.from('referral_uses').select('commission_amount').limit(20000),
            sb
                .from('payments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending'),
            sb.from('leads').select('*', { count: 'exact', head: true }).eq('is_read', false),
        ]);
        const completed = salesAgg.data || [];
        const totalSales = completed.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const buckets = new Map();
        const keys = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            keys.push(key);
            buckets.set(key, { sales: 0, transactions: 0 });
        }
        for (const p of completed) {
            const d = new Date(p.created_at);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            const b = buckets.get(key);
            if (b) {
                b.sales += parseFloat(p.amount) || 0;
                b.transactions += 1;
            }
        }
        const monthlySales = keys.map((key) => {
            const [y, m] = key.split('-').map(Number);
            const label = new Date(y, m, 1).toLocaleString('en', { month: 'short' });
            const b = buckets.get(key);
            return {
                month: label,
                sales: Math.round(b.sales * 100) / 100,
                transactions: b.transactions,
            };
        });
        const totalReferrals = (referralsAgg.data || []).reduce((sum, r) => sum + (r.total_referrals || 0), 0);
        const referralUses = referralUsesAgg.data || [];
        const commissionsTotal = Math.round(referralUses.reduce((sum, u) => sum + (parseFloat(u.commission_amount) || 0), 0) * 100) / 100;
        const data = {
            totalSales: Math.round(totalSales * 100) / 100,
            totalTransactions: completed.length,
            completedPayments: completedCount.count ?? completed.length,
            activeSubscriptions: activeSubs.count || 0,
            totalUsers: totalUsers.count || 0,
            activeReferrers: activeReferrers.count || 0,
            totalReferrals,
            licensesIssued: licensesCount.count || 0,
            referralPayments: referralUses.length,
            commissionsTotal,
            pendingPayments: pendingPayments.count || 0,
            unreadLeads: unreadLeads.count || 0,
            monthlySales,
        };
        cache = { at: Date.now(), data };
        return data;
    }
    async getPlans() {
        const { data, error } = await this.supabase
            .from('plans')
            .select('*')
            .eq('is_active', true)
            .order('tier', { ascending: true })
            .order('is_enterprise', { ascending: true })
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