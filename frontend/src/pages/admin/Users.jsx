import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../lib/axios';
import { useDebounce } from '../../hooks/useDebounce';

export default function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const debouncedSearch = useDebounce(search, 400);

  const fetchUsers = useCallback(async (p, q) => {
    try {
      setLoading(true);
      const { data } = await api.get('/users', { params: { page: p, limit, search: q || undefined } });
      setUsers(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // P1: debounce — 1 request por pausa de tipeo, resetea a página 1
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchUsers(page, debouncedSearch);
  }, [page, debouncedSearch, fetchUsers]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page animate-fadeInUp overflow-x-hidden">
      <div className="page-header">
        <h1 className="text-2xl md:text-3xl font-extrabold leading-tight" style={{ color: 'var(--color-text-primary)' }}>{t('admin.users.title')}</h1>
        <p className="text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>{t('admin.users.subtitle')}</p>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-4" role="search">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} aria-hidden="true" />
          <input
            type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl outline-none text-base shadow-sm min-h-[48px]"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            placeholder={t('admin.users.search')}
            aria-label={t('admin.users.search')}
          />
        </div>
      </form>

      <div className="card shadow-2xl overflow-hidden rounded-[1.5rem]" style={{ padding: 0, border: '1px solid var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="table-admin w-full min-w-[720px]">
            <thead>
              <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                {[t('admin.users.user'), t('admin.users.email'), t('admin.users.role'), t('admin.users.subscriptions'), t('admin.users.joined')].map(h => (
                  <th key={h} scope="col" className="text-left text-xs font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent mx-auto" role="status" aria-label="Loading users" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}></div></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-base" style={{ color: 'var(--color-text-muted)' }}>{t('admin.users.noData')}</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors duration-200">
                  <td>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shrink-0" style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' }} aria-hidden="true">
                        {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{user.full_name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{user.email}</td>
                  <td>
                    <span className="px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest" style={{
                      background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : user.role === 'staff' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: user.role === 'admin' ? 'var(--color-error)' : user.role === 'staff' ? 'var(--color-info)' : 'var(--color-success)',
                    }}>
                      {user.role}
                    </span>
                  </td>
                  {/* P1 fix: el backend devuelve subscriptions[], no subscription_count */}
                  <td className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{user.subscriptions?.length ?? user.subscription_count ?? 0}</td>
                  <td className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4" aria-label="Pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-3 px-6 rounded-2xl disabled:opacity-30 min-h-[48px]" aria-label="Previous page">
            <ChevronLeft size={20} /> <span className="hidden sm:inline">Previous</span>
          </button>
          <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }} aria-current="page">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-3 px-6 rounded-2xl disabled:opacity-30 min-h-[48px]" aria-label="Next page">
            <span className="hidden sm:inline">Next</span> <ChevronRight size={20} />
          </button>
        </nav>
      )}
    </div>
  );
}
