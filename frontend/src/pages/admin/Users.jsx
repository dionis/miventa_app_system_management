import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../lib/axios';

export default function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/users', { params: { page, limit, search } });
      setUsers(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-10 animate-fadeInUp">
      <div>
        <h1 className="text-4xl md:text-5xl font-black mb-2 leading-tight" style={{ color: 'var(--color-text-primary)' }}>{t('admin.users.title')}</h1>
        <p className="text-lg md:text-xl" style={{ color: 'var(--color-text-secondary)' }}>{t('admin.users.subtitle')}</p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-5 rounded-2xl outline-none text-lg shadow-sm"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            placeholder={t('admin.users.search')}
          />
        </div>
        <button type="submit" className="btn-secondary py-5 px-10 text-lg rounded-2xl">{t('admin.users.searchBtn')}</button>
      </form>

      <div className="card shadow-2xl overflow-hidden rounded-[2rem]" style={{ padding: 0, border: '1px solid var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                {[t('admin.users.user'), t('admin.users.email'), t('admin.users.role'), t('admin.users.subscriptions'), t('admin.users.joined')].map(h => (
                  <th key={h} className="text-left px-8 py-6 text-sm font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}></div></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-24 text-lg" style={{ color: 'var(--color-text-muted)' }}>{t('admin.users.noData')}</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors duration-200">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0" style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' }}>
                        {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{user.full_name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-base" style={{ color: 'var(--color-text-secondary)' }}>{user.email}</td>
                  <td className="px-8 py-6">
                    <span className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest" style={{
                      background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : user.role === 'staff' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: user.role === 'admin' ? 'var(--color-error)' : user.role === 'staff' ? 'var(--color-info)' : 'var(--color-success)',
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{user.subscription_count || 0}</td>
                  <td className="px-8 py-6 text-base" style={{ color: 'var(--color-text-muted)' }}>{new Date(user.created_at).toLocaleDateString()}</td>
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
