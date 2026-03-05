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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Referrals</h1>
                    <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>Manage your referral partners</p>
                </div>
                <button onClick={openCreate} className="btn-primary">
                    <Plus size={18} /> Add Referrer
                </button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl outline-none"
                        style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                        placeholder="Search by name, email, or referral code..."
                    />
                </div>
                <button type="submit" className="btn-secondary">Search</button>
            </form>

            {/* Table */}
            <div className="card overflow-hidden" style={{ padding: 0 }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                {['Name', 'Email', 'Referral Code', 'Referrals', 'Earnings', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="text-left px-6 py-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-t-transparent mx-auto" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}></div></td></tr>
                            ) : referrers.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>No referrers found</td></tr>
                            ) : referrers.map((ref) => (
                                <tr key={ref.id} className="transition-colors duration-200" style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td className="px-6 py-4 font-medium" style={{ color: 'var(--color-text-primary)' }}>{ref.full_name}</td>
                                    <td className="px-6 py-4" style={{ color: 'var(--color-text-secondary)' }}>{ref.email}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => copyCode(ref.referral_code)} className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all" style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                                            {ref.referral_code}
                                            {copiedCode === ref.referral_code ? <CheckCircle size={14} /> : <Copy size={14} />}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4" style={{ color: 'var(--color-text-primary)' }}>{ref.total_referrals}</td>
                                    <td className="px-6 py-4 font-semibold" style={{ color: 'var(--color-success)' }}>${ref.total_earnings}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{
                                            background: ref.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: ref.is_active ? 'var(--color-success)' : 'var(--color-error)',
                                        }}>
                                            {ref.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEdit(ref)} className="p-2 rounded-lg transition-all hover:scale-110" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-info)' }}><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(ref.id)} className="p-2 rounded-lg transition-all hover:scale-110" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-error)' }}><Trash2 size={16} /></button>
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
