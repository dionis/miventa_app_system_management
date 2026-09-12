import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Edit2, Trash2, X, Copy, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';
import { useDebounce } from '../../hooks/useDebounce';

const schema = z.object({
  full_name: z.string().trim().min(2, 'Name too short').max(120),
  email: z.string().trim().email('Invalid email').max(255),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  bank_account_number: z.string().trim().max(60).optional().or(z.literal('')),
  bank_name: z.string().trim().max(120).optional().or(z.literal('')),
});

export default function Referrals() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [referrers, setReferrers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const debouncedSearch = useDebounce(search, 400);
  const [showModal, setShowModal] = useState(false);
  const [editingReferrer, setEditingReferrer] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cfg, setCfg] = useState({ referral_discount_percent: 10, referral_commission_percent: 10 });
  const [cfgSaving, setCfgSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', email: '', phone: '', bank_account_number: '', bank_name: '' },
  });

  const fetchReferrers = useCallback(async (p, q) => {
    try {
      setLoading(true);
      const { data } = await api.get('/referrals', { params: { page: p, limit, search: q || undefined } });
      setReferrers(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setReferrers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setPage(1); }, [debouncedSearch]);
  useEffect(() => { fetchReferrers(page, debouncedSearch); }, [page, debouncedSearch, fetchReferrers]);
  useEffect(() => {
    api.get('/referrals/config').then(({ data }) => {
      if (data) setCfg((c) => ({ ...c, ...data }));
    }).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingReferrer(null);
    reset({ full_name: '', email: '', phone: '', bank_account_number: '', bank_name: '' });
    setShowModal(true);
  };

  const openEdit = (ref) => {
    setEditingReferrer(ref);
    reset({
      full_name: ref.full_name || '', email: ref.email || '', phone: ref.phone || '',
      bank_account_number: ref.bank_account_number || '', bank_name: ref.bank_name || '',
    });
    setShowModal(true);
  };

  const onSubmit = async (form) => {
    try {
      if (editingReferrer) {
        await api.patch(`/referrals/${editingReferrer.id}`, form);
        addToast(t('admin.referrals.updated'), 'success');
      } else {
        await api.post('/referrals', form);
        addToast(t('admin.referrals.created'), 'success');
      }
      setShowModal(false);
      fetchReferrers(page, debouncedSearch);
    } catch {
      addToast(t('admin.referrals.saveError'), 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/referrals/${deleteTarget.id}`);
      addToast(t('admin.referrals.deleted'), 'success');
      setDeleteTarget(null);
      fetchReferrers(page, debouncedSearch);
    } catch {
      addToast(t('admin.referrals.deleteError'), 'error');
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopiedCode(code);
    addToast(t('admin.referrals.copied'), 'info');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const totalPages = Math.ceil(total / limit);
  const err = (m) => (m ? <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>{m}</p> : null);

  const saveConfig = async (e) => {
    e?.preventDefault?.();
    setCfgSaving(true);
    try {
      const { data } = await api.patch('/referrals/config', {
        referral_discount_percent: Number(cfg.referral_discount_percent),
        referral_commission_percent: Number(cfg.referral_commission_percent),
      });
      if (data) setCfg((c) => ({ ...c, ...data }));
      addToast(t('admin.referrals.configSaved'), 'success');
    } catch {
      addToast(t('admin.referrals.saveError'), 'error');
    } finally {
      setCfgSaving(false);
    }
  };

  return (
    <div className="page animate-fadeInUp overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="page-header !mb-0">
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight" style={{ color: 'var(--color-text-primary)' }}>{t('admin.referrals.title')}</h1>
          <p className="text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>{t('admin.referrals.subtitle')}</p>
        </div>
        <button onClick={openCreate} className="btn-primary py-3 px-6 text-base rounded-2xl shadow-xl active:scale-[0.98] min-h-[48px] w-full md:w-auto justify-center">
          <Plus size={20} /> {t('admin.referrals.addNew')}
        </button>
      </div>

      <form onSubmit={saveConfig} className="card flex flex-col md:flex-row md:items-end gap-4 rounded-[1.5rem]" style={{ border: '1px solid var(--color-border)' }}>
        <div className="flex-1">
          <h2 className="text-base font-extrabold" style={{ color: 'var(--color-text-primary)' }}>{t('admin.referrals.configTitle')}</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t('admin.referrals.configHint')}</p>
        </div>
        <label className="flex flex-col gap-1 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('admin.referrals.discountPct')}
          <input type="number" min={0} max={90} step={0.5} value={cfg.referral_discount_percent}
            onChange={(e) => setCfg((c) => ({ ...c, referral_discount_percent: e.target.value }))}
            className="px-4 py-3 rounded-xl outline-none min-h-[48px] w-32"
            style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('admin.referrals.commissionPct')}
          <input type="number" min={0} max={100} step={0.5} value={cfg.referral_commission_percent}
            onChange={(e) => setCfg((c) => ({ ...c, referral_commission_percent: e.target.value }))}
            className="px-4 py-3 rounded-xl outline-none min-h-[48px] w-32"
            style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
        </label>
        <button type="submit" disabled={cfgSaving} className="btn-primary min-h-[48px] disabled:opacity-50">
          {t('admin.referrals.saveConfig')}
        </button>
      </form>

      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-4" role="search">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} aria-hidden="true" />
          <input
            type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl outline-none text-base shadow-sm min-h-[48px]"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            placeholder={t('admin.referrals.search')}
            aria-label={t('admin.referrals.search')}
          />
        </div>
      </form>

      <div className="card shadow-2xl overflow-hidden rounded-[1.5rem]" style={{ padding: 0, border: '1px solid var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="table-admin w-full min-w-[820px]">
            <thead>
              <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                {[t('admin.referrals.name'), t('admin.referrals.email'), t('admin.referrals.referralCode'), t('admin.referrals.referrals'), t('admin.referrals.earnings'), t('admin.referrals.status'), t('admin.referrals.actions')].map(h => (
                  <th key={h} scope="col" className="text-left text-xs font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent mx-auto" role="status" aria-label="Loading referrers" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}></div></td></tr>
              ) : referrers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-base" style={{ color: 'var(--color-text-muted)' }}>{t('admin.referrals.noData')}</td></tr>
              ) : referrers.map((ref) => (
                <tr key={ref.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors duration-200">
                  <td className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{ref.full_name}</td>
                  <td className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{ref.email}</td>
                  <td>
                    <button onClick={() => copyCode(ref.referral_code)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-black transition-all active:scale-95 shadow-sm min-h-[44px]" style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }} aria-label={`Copy ${ref.referral_code}`}>
                      {ref.referral_code}
                      {copiedCode === ref.referral_code ? <CheckCircle size={15} /> : <Copy size={15} />}
                    </button>
                  </td>
                  <td className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{ref.total_referrals}</td>
                  <td className="font-black" style={{ color: 'var(--color-success)' }}>${ref.total_earnings}</td>
                  <td>
                    <span className="px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest" style={{
                      background: ref.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: ref.is_active ? 'var(--color-success)' : 'var(--color-error)',
                    }}>
                      {ref.is_active ? t('admin.referrals.active') : t('admin.referrals.inactive')}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(ref)} className="p-3 rounded-xl transition-all active:scale-95 shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-info)' }} aria-label={`Edit ${ref.full_name}`}><Edit2 size={17} /></button>
                      <button onClick={() => setDeleteTarget(ref)} className="p-3 rounded-xl transition-all active:scale-95 shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-error)' }} aria-label={`Delete ${ref.full_name}`}><Trash2 size={17} /></button>
                    </div>
                  </td>
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} role="dialog" aria-modal="true" aria-label={editingReferrer ? t('admin.referrals.editTitle') : t('admin.referrals.addTitle')}>
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 relative max-h-[92dvh] overflow-y-auto" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-3 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }} aria-label="Close dialog"><X size={18} /></button>
            <h3 className="text-lg font-bold mb-5 pr-12" style={{ color: 'var(--color-text-primary)' }}>{editingReferrer ? t('admin.referrals.editTitle') : t('admin.referrals.addTitle')} {t('admin.referrals.title')}</h3>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {[
                { label: t('admin.referrals.fullName'), key: 'full_name', type: 'text', required: true },
                { label: 'Email', key: 'email', type: 'email', required: true },
                { label: t('admin.referrals.phone'), key: 'phone', type: 'tel' },
                { label: t('admin.referrals.bankAccount'), key: 'bank_account_number', type: 'text' },
                { label: t('admin.referrals.bankName'), key: 'bank_name', type: 'text' },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label htmlFor={`ref-${key}`} className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{label} {required && '*'}</label>
                  <input
                    id={`ref-${key}`}
                    type={type}
                    {...register(key)}
                    className="w-full px-4 py-3 rounded-xl outline-none min-h-[48px]"
                    style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                  {err(errors[key]?.message)}
                </div>
              ))}
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center min-h-[52px] disabled:opacity-50">
                {editingReferrer ? t('admin.referrals.update') : t('admin.referrals.create')} {t('admin.referrals.title')}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t('admin.referrals.title')}
        message={t('admin.referrals.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
      />
    </div>
  );
}
