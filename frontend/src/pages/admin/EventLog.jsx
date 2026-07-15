import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../lib/axios';

export default function EventLog() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterEntity, setFilterEntity] = useState('');
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    try {
      const params = { page, limit };
      if (filterEntity) params.entity_type = filterEntity;
      const { data } = await api.get('/logs', { params });
      setLogs(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, filterEntity]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  const actionColors = {
    payment_initiated: '#f59e0b',
    payment_completed: '#10b981',
    payment_failed: '#ef4444',
    user_created: '#3b82f6',
    user_updated: '#6366f1',
    referral_created: '#8b5cf6',
    subscription_created: '#06b6d4',
    default: '#64748b',
  };

  const getActionColor = (action) => actionColors[action] || actionColors.default;

  return (
    <div className="space-y-10 animate-fadeInUp">
      <div>
        <h1 className="text-4xl md:text-5xl font-black mb-2 leading-tight" style={{ color: 'var(--color-text-primary)' }}>{t('admin.logs.title')}</h1>
        <p className="text-lg md:text-xl" style={{ color: 'var(--color-text-secondary)' }}>{t('admin.logs.subtitle')}</p>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Entity:</label>
        <select
          value={filterEntity}
          onChange={(e) => { setFilterEntity(e.target.value); setPage(1); }}
          className="px-5 py-3 rounded-xl outline-none text-base font-medium shadow-sm"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          <option value="">{t('admin.logs.all')}</option>
          <option value="payment">Payments</option>
          <option value="referral">Referrals</option>
          <option value="subscription">Subscriptions</option>
          <option value="user">Users</option>
        </select>
      </div>

      <div className="card shadow-2xl overflow-hidden rounded-[2rem]" style={{ padding: 0, border: '1px solid var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                {[t('admin.logs.timestamp'), t('admin.logs.action'), t('admin.logs.entity'), t('admin.logs.details'), t('admin.logs.actor')].map(h => (
                  <th key={h} className="text-left px-8 py-6 text-sm font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}></div></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-24 text-lg" style={{ color: 'var(--color-text-muted)' }}>{t('admin.logs.noData')}</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors duration-200">
                  <td className="px-8 py-6 text-sm font-mono" style={{ color: 'var(--color-text-muted)' }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-8 py-6">
                    <span className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest" style={{
                      background: `${getActionColor(log.action)}15`,
                      color: getActionColor(log.action),
                    }}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{log.entity_type}</span>
                      <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{log.entity_id?.slice(0, 8)}...</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      {log.details ? JSON.stringify(log.details).slice(0, 60) + '...' : '-'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{log.actor_email || log.actor_id?.slice(0, 8) || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-4 px-8 rounded-2xl disabled:opacity-30 transition-all">
            <ChevronLeft size={20} /> Previous
          </button>
          <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-4 px-8 rounded-2xl disabled:opacity-30 transition-all">
            Next <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
