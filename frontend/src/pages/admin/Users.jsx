import { useState, useEffect } from 'react';
import { Search, User, CreditCard } from 'lucide-react';
import api from '../../lib/axios';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => { fetchUsers(); }, [page]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/users', { params: { page, limit: 20, search } });
            setUsers(data.data || []);
            setTotal(data.total || 0);
        } catch {
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    return (
        <div className="space-y-10 animate-fadeInUp">
            <div>
                <h1 className="text-4xl md:text-5xl font-black mb-2 leading-tight" style={{ color: 'var(--color-text-primary)' }}>Users</h1>
                <p className="text-lg md:text-xl" style={{ color: 'var(--color-text-secondary)' }}>Browse and search registered customers.</p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 rounded-2xl outline-none text-lg shadow-sm"
                        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                        placeholder="Search by name or phone..."
                    />
                </div>
                <button type="submit" className="btn-secondary py-5 px-10 text-lg rounded-2xl">Search</button>
            </form>

            {/* Table */}
            <div className="card shadow-2xl overflow-hidden rounded-[2rem]" style={{ padding: 0, border: '1px solid var(--color-border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                                {['User', 'Email', 'Role', 'Subscriptions', 'Joined'].map(h => (
                                    <th key={h} className="text-left px-8 py-6 text-sm font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}></div></td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-24 text-lg" style={{ color: 'var(--color-text-muted)' }}>No users found</td></tr>
                            ) : users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors duration-200">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))', color: 'white' }}>
                                                <User size={22} />
                                            </div>
                                            <span className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{user.full_name || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-base" style={{ color: 'var(--color-text-secondary)' }}>{user.email || 'N/A'}</td>
                                    <td className="px-8 py-6">
                                        <span className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest" style={{
                                            background: user.role === 'admin' ? 'rgba(99, 102, 241, 0.1)' : user.role === 'staff' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                            color: user.role === 'admin' ? 'var(--color-brand)' : user.role === 'staff' ? 'var(--color-info)' : 'var(--color-text-muted)',
                                        }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-lg font-bold">
                                        {user.subscriptions?.length > 0 ? (
                                            <div className="flex items-center gap-3">
                                                <CreditCard size={20} style={{ color: 'var(--color-success)' }} />
                                                <span style={{ color: 'var(--color-text-primary)' }}>{user.subscriptions.length}</span>
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--color-text-muted)' }}>None</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-base" style={{ color: 'var(--color-text-muted)' }}>
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {total > 20 && (
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="btn-secondary text-sm py-2 px-4 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        Page {page} of {Math.ceil(total / 20)}
                    </span>
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={page >= Math.ceil(total / 20)}
                        className="btn-secondary text-sm py-2 px-4 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
