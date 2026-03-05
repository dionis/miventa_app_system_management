import { Injectable } from '@nestjs/common';
import { getSupabaseAdmin } from '../config/supabase';

@Injectable()
export class DashboardService {
    private get supabase() {
        return getSupabaseAdmin();
    }

    async getStats() {
        // Total sales (completed payments)
        const { data: salesData } = await this.supabase
            .from('payments')
            .select('amount')
            .eq('status', 'completed');

        const totalSales = (salesData || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const totalTransactions = salesData?.length || 0;

        // Active subscriptions
        const { count: activeSubscriptions } = await this.supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        // Total users
        const { count: totalUsers } = await this.supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // Active referrers
        const { count: activeReferrers } = await this.supabase
            .from('referrers')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        // Total referrals
        const { data: referralData } = await this.supabase
            .from('referrers')
            .select('total_referrals');
        const totalReferrals = (referralData || []).reduce((sum, r) => sum + r.total_referrals, 0);

        // Pending payments
        const { count: pendingPayments } = await this.supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        // Unread leads
        const { count: unreadLeads } = await this.supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false);

        // Monthly sales data (last 6 months)
        const monthlySales: { month: string; sales: number; transactions: number }[] = [];
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

        if (error) throw error;
        return data;
    }
}
