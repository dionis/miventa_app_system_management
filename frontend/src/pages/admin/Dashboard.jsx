import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Users, UserPlus, CreditCard, TrendingUp, Mail, Clock, KeyRound, BadgeCheck, Percent, HandCoins } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import StatsCard from '../../components/admin/StatsCard';
import api from '../../lib/axios';

function DashboardSkeleton() {
  return (
    <div className="page" role="status" aria-label="Loading dashboard">
      <div className="page-header">
        <div className="skeleton h-8 w-56" />
        <div className="skeleton h-5 w-80 max-w-full" />
      </div>
      <div className="page-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card">
            <div className="skeleton h-4 w-24 mb-3" />
            <div className="skeleton h-8 w-32" />
          </div>
        ))}
      </div>
      <div className="page-grid grid-cols-1 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="card card-lg">
            <div className="skeleton h-5 w-40 mb-5" />
            <div className="skeleton h-[280px] w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '16px',
  color: 'var(--color-text-primary)',
  boxShadow: 'var(--shadow-xl)',
  padding: '0.75rem',
  fontSize: '14px',
};

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/dashboard/stats');
      setStats(data);
    } catch (err) {
      // P0: NUNCA mostrar datos mock. Fallar visible con retry.
      setError(err.response?.data?.message || 'Failed to load dashboard stats');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <DashboardSkeleton />;

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-1 leading-tight" style={{ color: 'var(--color-text-primary)' }}>{t('admin.dashboard.title')}</h1>
          <p className="text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>{t('admin.dashboard.subtitle')}</p>
        </div>
        <div className="card shadow-xl" style={{ padding: '1.5rem', border: '1px solid var(--color-border)' }} role="alert">
          <p className="text-base font-bold mb-2" style={{ color: 'var(--color-error)' }}>
            {error || 'No stats available'}
          </p>
          <p className="mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Check your connection or backend (/api/dashboard/stats) and try again.
          </p>
          <button onClick={fetchStats} className="btn-primary min-h-[48px]">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page overflow-x-hidden">
      <div className="page-header animate-fadeInUp">
        <h1 className="text-2xl md:text-3xl font-extrabold leading-tight" style={{ color: 'var(--color-text-primary)' }}>{t('admin.dashboard.title')}</h1>
        <p className="text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>{t('admin.dashboard.subtitle')}</p>
      </div>

      {/* KPIs: 1 col mobile -> 2 sm -> 4 lg. Sin trends falsos hasta que el backend los provea. */}
      <div className="page-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title={t('admin.dashboard.totalSales')} value={`$${Number(stats.totalSales || 0).toLocaleString()}`} icon={DollarSign} color="#6366f1" />
        <StatsCard title={t('admin.dashboard.activeSubscriptions')} value={stats.activeSubscriptions} icon={CreditCard} color="#10b981" />
        <StatsCard title={t('admin.dashboard.totalUsers')} value={stats.totalUsers} icon={Users} color="#3b82f6" />
        <StatsCard title={t('admin.dashboard.activeReferrers')} value={stats.activeReferrers} icon={UserPlus} color="#f59e0b" />
      </div>

      {/* Charts: altura adaptativa, touch-friendly, sin overflow horizontal */}
      <div className="page-grid grid-cols-1 lg:grid-cols-2">
        <div className="card card-lg shadow-xl min-w-0">
          <h3 className="text-base md:text-lg font-bold mb-5" style={{ color: 'var(--color-text-primary)' }}>{t('admin.dashboard.revenueOverview')}</h3>
          <div className="h-[280px] md:h-[340px] w-full" role="img" aria-label={t('admin.dashboard.revenueOverview')}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlySales} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={12} tickMargin={8} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} axisLine={false} tickLine={false} width={56} tickFormatter={(value) => `$${value}`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" fill="url(#colorSales)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card card-lg shadow-xl min-w-0">
          <h3 className="text-base md:text-lg font-bold mb-5" style={{ color: 'var(--color-text-primary)' }}>{t('admin.dashboard.transactions')}</h3>
          <div className="h-[280px] md:h-[340px] w-full" role="img" aria-label={t('admin.dashboard.transactions')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlySales} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={12} tickMargin={8} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={tooltipStyle} />
                <Bar dataKey="transactions" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secundarios */}
      <div className="page-grid grid-cols-1 sm:grid-cols-3">
        <div className="card flex items-center gap-5 shadow-lg min-w-0">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }} aria-hidden="true">
            <Clock size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-black truncate" style={{ color: 'var(--color-text-primary)' }}>{stats.pendingPayments}</p>
            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-muted)' }}>{t('admin.dashboard.pendingPayments')}</p>
          </div>
        </div>
        <div className="card flex items-center gap-5 shadow-lg min-w-0">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-info)' }} aria-hidden="true">
            <Mail size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-black truncate" style={{ color: 'var(--color-text-primary)' }}>{stats.unreadLeads}</p>
            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-muted)' }}>{t('admin.dashboard.unreadLeads')}</p>
          </div>
        </div>
        <div className="card flex items-center gap-5 shadow-lg min-w-0">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }} aria-hidden="true">
            <TrendingUp size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-black truncate" style={{ color: 'var(--color-text-primary)' }}>{stats.totalReferrals}</p>
            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-muted)' }}>{t('admin.dashboard.totalReferrals')}</p>
          </div>
        </div>
      </div>

      {/* Pagos y licencias: conteos exactos para auditoría */}
      <div className="page-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-5 shadow-lg min-w-0">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }} aria-hidden="true">
            <BadgeCheck size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-black truncate" style={{ color: 'var(--color-text-primary)' }}>{stats.completedPayments ?? stats.totalTransactions}</p>
            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-muted)' }}>{t('admin.dashboard.completedPayments')}</p>
          </div>
        </div>
        <div className="card flex items-center gap-5 shadow-lg min-w-0">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }} aria-hidden="true">
            <KeyRound size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-black truncate" style={{ color: 'var(--color-text-primary)' }}>{stats.licensesIssued ?? 0}</p>
            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-muted)' }}>{t('admin.dashboard.licensesIssued')}</p>
          </div>
        </div>
        <div className="card flex items-center gap-5 shadow-lg min-w-0">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }} aria-hidden="true">
            <Percent size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-black truncate" style={{ color: 'var(--color-text-primary)' }}>{stats.referralPayments ?? 0}</p>
            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-muted)' }}>{t('admin.dashboard.referralPayments')}</p>
          </div>
        </div>
        <div className="card flex items-center gap-5 shadow-lg min-w-0">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-info)' }} aria-hidden="true">
            <HandCoins size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-black truncate" style={{ color: 'var(--color-text-primary)' }}>${Number(stats.commissionsTotal || 0).toLocaleString()}</p>
            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-muted)' }}>{t('admin.dashboard.commissionsTotal')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
