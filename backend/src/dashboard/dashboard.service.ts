import { Injectable } from '@nestjs/common';
import { getSupabaseAdmin } from '../config/supabase';

const CACHE_TTL_MS = 60 * 1000;
let cache: { at: number; data: any } | null = null;

@Injectable()
export class DashboardService {
  private get supabase() {
    return getSupabaseAdmin();
  }

  async getStats() {
    // P1: caché en memoria 60s (evita el N+1 y el full-scan por cada refresh del admin)
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;

    const sb = this.supabase;
    // P1: counts en paralelo (antes: 7 queries secuenciales + 6 en loop)
    const [
      salesAgg,
      activeSubs,
      totalUsers,
      activeReferrers,
      referralsAgg,
      pendingPayments,
      unreadLeads,
    ] = await Promise.all([
      // Una sola query de pagos completados; el agregado mensual se hace en JS
      sb
        .from('payments')
        .select('amount,created_at')
        .eq('status', 'completed')
        .limit(20000),
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
      sb
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      sb.from('leads').select('*', { count: 'exact', head: true }).eq('is_read', false),
    ]);

    const completed = salesAgg.data || [];
    const totalSales = completed.reduce(
      (sum, p) => sum + (parseFloat(p.amount) || 0),
      0,
    );

    // Agregado mensual en memoria (últimos 6 meses) — 0 queries extra
    const buckets = new Map<string, { sales: number; transactions: number }>();
    const keys: string[] = [];
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
      const b = buckets.get(key)!;
      return {
        month: label,
        sales: Math.round(b.sales * 100) / 100,
        transactions: b.transactions,
      };
    });

    const totalReferrals = (referralsAgg.data || []).reduce(
      (sum, r) => sum + (r.total_referrals || 0),
      0,
    );

    const data = {
      totalSales: Math.round(totalSales * 100) / 100,
      totalTransactions: completed.length,
      activeSubscriptions: activeSubs.count || 0,
      totalUsers: totalUsers.count || 0,
      activeReferrers: activeReferrers.count || 0,
      totalReferrals,
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
      .order('duration_months', { ascending: true });

    if (error) throw error;
    return data;
  }
}
