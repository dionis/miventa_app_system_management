import { useState, useEffect } from 'react';
import { FileText, Filter } from 'lucide-react';
import api from '../../lib/axios';

const ACTION_COLORS = {
    payment_initiated: '#f59e0b',
    payment_completed: '#10b981',
    referrer_created: '#6366f1',
    referrer_updated: '#3b82f6',
    referrer_deleted: '#ef4444',
};

export default function EventLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState('');

    useEffect(() => { fetchLogs(); }, [page, filter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 30 };
            if (filter) params.entity_type = filter;
            const { data } = await api.get('/logs', { params });
            setLogs(data.data || []);
            setTotal(data.total || 0);
        } catch {
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10 animate-fadeInUp">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black mb-2 leading-tight" style={{ color: 'var(--color-text-primary)' }}>Event Log</h1>
                    <p className="text-lg md:text-xl" style={{ color: 'var(--color-text-secondary)' }}>Read-only audit trail of system actions.</p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl shadow-sm" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                    <Filter size={20} style={{ color: 'var(--color-brand)' }} />
                </div>
                <select
                    value={filter}
                    onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                    className="px-6 py-3 rounded-2xl outline-none text-base font-bold shadow-sm cursor-pointer"
                    style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                    <option value="">All Events</option>
                    <option value="payment">Payments</option>
                    <option value="referrer">Referrals</option>
                    <option value="subscription">Subscriptions</option>
                    <option value="user">Users</option>
                </select>
            </div>

            {/* Log entries */}
            <div className="card shadow-2xl overflow-hidden rounded-[2rem]" style={{ padding: 0, border: '1px solid var(--color-border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                                {['Timestamp', 'Action', 'Entity', 'Details', 'Actor'].map(h => (
                                    <th key={h} className="text-left px-8 py-6 text-sm font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}></div></td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-24 text-lg" style={{ color: 'var(--color-text-muted)' }}>No events found</td></tr>
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors duration-200">
                                    <td className="px-8 py-6 whitespace-nowrap text-base" style={{ color: 'var(--color-text-muted)' }}>
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest" style={{
                                            background: `${ACTION_COLORS[log.action] || '#6b7280'}15`,
                                            color: ACTION_COLORS[log.action] || '#6b7280',
                                        }}>
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="capitalize font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{log.entity_type}</span>
                                        <span className="text-xs ml-3 font-mono opacity-50" style={{ color: 'var(--color-text-muted)' }}>{log.entity_id?.slice(0, 8)}</span>
                                    </td>
                                    <td className="px-8 py-6 max-w-xs truncate text-base" style={{ color: 'var(--color-text-secondary)' }}>
                                        {log.details ? JSON.stringify(log.details).slice(0, 80) : '—'}
                                    </td>
                                    <td className="px-8 py-6 text-base font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                        {log.actor_email || log.actor_id?.slice(0, 8) || 'System'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {total > 30 && (
                <div className="flex items-center justify-center gap-3">
                    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary text-sm py-2 px-4 disabled:opacity-50">Previous</button>
                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Page {page} of {Math.ceil(total / 30)}</span>
                    <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / 30)} className="btn-secondary text-sm py-2 px-4 disabled:opacity-50">Next</button>
                </div>
            )}
        </div>
    );
}
