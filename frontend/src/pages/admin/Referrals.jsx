import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Edit2, Trash2, X, Copy, CheckCircle } from 'lucide-react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';

export default function Referrals() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [referrers, setReferrers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReferrer, setEditingReferrer] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', bank_account_number: '', bank_name: '' });
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchReferrers = useCallback(async () => {
    try {
      const { data } = await api.get('/referrals', { params: { search } });
      setReferrers(data.data || []);
    } catch {
      setReferrers([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchReferrers(); }, [fetchReferrers]);

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
    setForm({
      full_name: ref.full_name, email: ref.email, phone: ref.phone || '',
      bank_account_number: ref.bank_account_number || '', bank_name: ref.bank_name || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReferrer) {
        await api.patch(`/referrals/${editingReferrer.id}`, form);
        addToast(t('admin.referrals.update') + ' ' + t('admin.referrals.title'), 'success');
      } else {
        await api.post('/referrals', form);
        addToast(t('admin.referrals.title') + ' ' + t('admin.referrals.create') + 'd', 'success');
      }
      setShowModal(false);
      fetchReferrers();
    } catch {
      addToast('Error saving referrer', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/referrals/${id}`);
      addToast('Referrer deleted', 'success');
      fetchReferrers();
    } catch {
      addToast('Error deleting referrer', 'error');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    addToast(t('admin.referrals.copied'), 'info');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-10 animate-fadeInUp">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black mb-2 leading-tight" style={{ color: 'var(--color-text-primary)' }}>{t('admin.referrals.title')}</h1>
          <p className="text-lg md:text-xl" style={{ color: 'var(--color-text-secondary)' }}>{t('admin.referrals.subtitle')}</p>
        </div>
        <button onClick={openCreate} className="btn-primary py-4 px-8 text-lg md:text-xl rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus size={22} /> {t('admin.referrals.addNew')}
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-5 rounded-2xl outline-none text-lg shadow-sm"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            placeholder={t('admin.referrals.search')}
          />
        </div>
        <button type="submit" className="btn-secondary py-5 px-10 text-lg rounded-2xl">{t('admin.referrals.searchBtn')}</button>
      </form>

      <div className="card shadow-2xl overflow-hidden rounded-[2rem]" style={{ padding: 0, border: '1px solid var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                {[t('admin.referrals.name'), t('admin.referrals.email'), t('admin.referrals.referralCode'), t('admin.referrals.referrals'), t('admin.referrals.earnings'), t('admin.referrals.status'), t('admin.referrals.actions')].map(h => (
                  <th key={h} className="text-left px-8 py-6 text-sm font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}></div></td></tr>
              ) : referrers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-24 text-lg" style={{ color: 'var(--color-text-muted)' }}>{t('admin.referrals.noData')}</td></tr>
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
                      {ref.is_active ? t('admin.referrals.active') : t('admin.referrals.inactive')}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg rounded-2xl p-8 relative" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 rounded-lg" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}><X size={18} /></button>
            <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>{editingReferrer ? t('admin.referrals.editTitle') : t('admin.referrals.addTitle')} {t('admin.referrals.title')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: t('admin.referrals.fullName'), key: 'full_name', type: 'text', required: true },
                { label: 'Email', key: 'email', type: 'email', required: true },
                { label: t('admin.referrals.phone'), key: 'phone', type: 'tel' },
                { label: t('admin.referrals.bankAccount'), key: 'bank_account_number', type: 'text' },
                { label: t('admin.referrals.bankName'), key: 'bank_name', type: 'text' },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{label} {required && '*'}</label>
                  <input
                    type={type} required={required} value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl outline-none"
                    style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
              ))}
              <button type="submit" className="btn-primary w-full justify-center">
                {editingReferrer ? t('admin.referrals.update') : t('admin.referrals.create')} {t('admin.referrals.title')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
