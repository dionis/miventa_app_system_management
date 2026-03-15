import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Copy, CheckCircle } from 'lucide-react';
import api from '../../lib/axios';

export default function Referrals() {
    const [referrers, setReferrers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingReferrer, setEditingReferrer] = useState(null);
    const [form, setForm] = useState({ full_name: '', email: '', phone: '', bank_account_number: '', bank_name: '' });
    const [copiedCode, setCopiedCode] = useState(null);

    useEffect(() => { fetchReferrers(); }, []);

    const fetchReferrers = async () => {
        try {
            const { data } = await api.get('/referrals', { params: { search } });
            setReferrers(data.data || []);
        } catch {
            setReferrers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchReferrers();
    };

    const openCreate = () => {
        setEditingReferrer(null);
        setForm({ full_name: '', email: '', phone: '', bank_account_number: '', bank_name: '' });
        setShowModal(true);
    };

    const openEdit = (ref) => {
        setEditingReferrer(ref);
        setForm({ full_name: ref.full_name, email: ref.email, phone: ref.phone || '', bank_account_number: ref.bank_account_number || '', bank_name: ref.bank_name || '' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingReferrer) {
                await api.patch(`/referrals/${editingReferrer.id}`, form);
            } else {
                await api.post('/referrals', form);
            }
            setShowModal(false);
            fetchReferrers();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving referrer');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this referrer?')) return;
        try {
            await api.delete(`/referrals/${id}`);
            fetchReferrers();
        } catch (err) {
            alert('Error deleting referrer');
        }
    };

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="space-y-10 animate-fadeInUp">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black mb-2 leading-tight" style={{ color: 'var(--color-text-primary)' }}>Referrals</h1>
                    <p className="text-lg md:text-xl" style={{ color: 'var(--color-text-secondary)' }}>Manage your referral partners and track performance.</p>
                </div>
                <button onClick={openCreate} className="btn-primary py-4 px-8 text-lg md:text-xl rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <Plus size={22} /> Add New Referrer
                </button>
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
                        placeholder="Search by name, email, or referral code..."
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
                                {['Name', 'Email', 'Referral Code', 'Referrals', 'Earnings', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="text-left px-8 py-6 text-sm font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}></div></td></tr>
                            ) : referrers.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-24 text-lg" style={{ color: 'var(--color-text-muted)' }}>No referrers found</td></tr>
                            ) : referrers.map((ref) => (
                                <tr key={ref.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors duration-200">
                                    <td className="px-8 py-6 font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{ref.full_name}</td>
                                    <td className="px-8 py-6 text-base" style={{ color: 'var(--color-text-secondary)' }}>{ref.email}</td>
                                    <td className="px-8 py-6">
                                        <button onClick={() => copyCode(ref.referral_code)} className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-mono font-black transition-all hover:scale-105 active:scale-95 shadow-sm" style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                                            {ref.referral_code}
                                            {copiedCode === ref.referral_code ? <CheckCircle size={16} /> : <Copy size={16} />}
                                        </button>
                                    </td>
                                    <td className="px-8 py-6 font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{ref.total_referrals}</td>
                                    <td className="px-8 py-6 font-black text-xl" style={{ color: 'var(--color-success)' }}>${ref.total_earnings}</td>
                                    <td className="px-8 py-6">
                                        <span className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest" style={{
                                            background: ref.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: ref.is_active ? 'var(--color-success)' : 'var(--color-error)',
                                        }}>
                                            {ref.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => openEdit(ref)} className="p-3 rounded-xl transition-all hover:scale-110 shadow-sm" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-info)' }}><Edit2 size={18} /></button>
                                            <button onClick={() => handleDelete(ref.id)} className="p-3 rounded-xl transition-all hover:scale-110 shadow-sm" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-error)' }}><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                    <div className="w-full max-w-lg rounded-2xl p-8 relative" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 rounded-lg" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}><X size={18} /></button>
                        <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>{editingReferrer ? 'Edit' : 'Add'} Referrer</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {[
                                { label: 'Full Name', key: 'full_name', type: 'text', required: true },
                                { label: 'Email', key: 'email', type: 'email', required: true },
                                { label: 'Phone', key: 'phone', type: 'tel' },
                                { label: 'Bank Account Number', key: 'bank_account_number', type: 'text' },
                                { label: 'Bank Name', key: 'bank_name', type: 'text' },
                            ].map(({ label, key, type, required }) => (
                                <div key={key}>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{label} {required && '*'}</label>
                                    <input
                                        type={type}
                                        required={required}
                                        value={form[key]}
                                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl outline-none"
                                        style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                                    />
                                </div>
                            ))}
                            <button type="submit" className="btn-primary w-full justify-center">
                                {editingReferrer ? 'Update' : 'Create'} Referrer
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
