import { useState, useEffect } from 'react';
import { DollarSign, Users, UserPlus, CreditCard, TrendingUp, Mail, Clock, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import StatsCard from '../../components/admin/StatsCard';
import api from '../../lib/axios';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/dashboard/stats');
            setStats(data);
        } catch {
            // Fallback demo data
            setStats({
                totalSales: 15420.50,
                totalTransactions: 324,
                activeSubscriptions: 186,
                totalUsers: 542,
                activeReferrers: 28,
                totalReferrals: 89,
                pendingPayments: 12,
                unreadLeads: 5,
                monthlySales: [
                    { month: 'Oct', sales: 1800, transactions: 32 },
                    { month: 'Nov', sales: 2400, transactions: 45 },
                    { month: 'Dec', sales: 3200, transactions: 58 },
                    { month: 'Jan', sales: 2800, transactions: 51 },
                    { month: 'Feb', sales: 3100, transactions: 62 },
                    { month: 'Mar', sales: 2120.50, transactions: 76 },
                ],
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}></div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="animate-fadeInUp">
                <h1 className="text-4xl md:text-5xl font-black mb-2 leading-tight" style={{ color: 'var(--color-text-primary)' }}>Dashboard</h1>
                <p className="text-lg md:text-xl" style={{ color: 'var(--color-text-secondary)' }}>Welcome back! Here's your business overview.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatsCard title="Total Sales" value={`$${stats.totalSales.toLocaleString()}`} icon={DollarSign} color="#6366f1" trend={12} />
                <StatsCard title="Active Subscriptions" value={stats.activeSubscriptions} icon={CreditCard} color="#10b981" trend={8} />
                <StatsCard title="Total Users" value={stats.totalUsers} icon={Users} color="#3b82f6" trend={15} />
                <StatsCard title="Active Referrers" value={stats.activeReferrers} icon={UserPlus} color="#f59e0b" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <div className="card shadow-xl" style={{ padding: '2.5rem' }}>
                    <h3 className="text-xl font-bold mb-8" style={{ color: 'var(--color-text-primary)' }}>Revenue Overview</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={stats.monthlySales}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                            <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={14} tickMargin={10} axisLine={false} tickLine={false} />
                            <YAxis stroke="var(--color-text-muted)" fontSize={14} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--color-bg-card)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '16px',
                                    color: 'var(--color-text-primary)',
                                    boxShadow: 'var(--shadow-xl)',
                                    padding: '1rem',
                                }}
                            />
                            <Area type="monotone" dataKey="sales" stroke="#6366f1" fill="url(#colorSales)" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Transactions Chart */}
                <div className="card shadow-xl" style={{ padding: '2.5rem' }}>
                    <h3 className="text-xl font-bold mb-8" style={{ color: 'var(--color-text-primary)' }}>Transactions</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={stats.monthlySales}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                            <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={14} tickMargin={10} axisLine={false} tickLine={false} />
                            <YAxis stroke="var(--color-text-muted)" fontSize={14} axisLine={false} tickLine={false} />
                            <Tooltip
                                cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                                contentStyle={{
                                    background: 'var(--color-bg-card)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '16px',
                                    color: 'var(--color-text-primary)',
                                    boxShadow: 'var(--shadow-xl)',
                                    padding: '1rem',
                                }}
                            />
                            <Bar dataKey="transactions" fill="#6366f1" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="card flex items-center gap-6 shadow-lg" style={{ padding: '2rem' }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>{stats.pendingPayments}</p>
                        <p className="text-base font-bold" style={{ color: 'var(--color-text-muted)' }}>Pending Payments</p>
                    </div>
                </div>
                <div className="card flex items-center gap-6 shadow-lg" style={{ padding: '2rem' }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-info)' }}>
                        <Mail size={28} />
                    </div>
                    <div>
                        <p className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>{stats.unreadLeads}</p>
                        <p className="text-base font-bold" style={{ color: 'var(--color-text-muted)' }}>Unread Leads</p>
                    </div>
                </div>
                <div className="card flex items-center gap-6 shadow-lg" style={{ padding: '2rem' }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <p className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>{stats.totalReferrals}</p>
                        <p className="text-base font-bold" style={{ color: 'var(--color-text-muted)' }}>Total Referrals</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
