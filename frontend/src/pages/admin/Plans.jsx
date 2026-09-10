import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';

const schema = z.object({
  key: z.string().regex(/^[a-z0-9-]+$/, 'slug: minúsculas, números, guiones').max(60).optional().or(z.literal('')),
  name: z.string().trim().min(2, 'Min 2').max(120),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  duration_months: z.coerce.number().int().min(0).max(120),
  price: z.coerce.number().min(0).max(1000000),
  currency: z.string().regex(/^[A-Z]{3}$/, 'ISO 4217 (USD)').optional().or(z.literal('')),
  tier: z.enum(['normal', 'premium']).default('normal'),
  is_enterprise: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export default function Plans() {
  const { t, i18n } = useTranslation();
  const { addToast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [features, setFeatures] = useState([]);
  const [featureInput, setFeatureInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [tierFilter, setTierFilter] = useState('all'); // all | normal | premium

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { key: '', name: '', description: '', duration_months: 1, price: 0, currency: 'USD', tier: 'normal', is_enterprise: false, is_active: true },
  });

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/plans');
      setPlans(Array.isArray(data) ? data : []);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const visiblePlans = tierFilter === 'all' ? plans : plans.filter((p) => (p.tier || 'normal') === tierFilter);

  const fmtMoney = (v, c) => {
    try {
      return new Intl.NumberFormat(i18n.language, { style: 'currency', currency: c || 'USD' }).format(Number(v) || 0);
    } catch {
      return `$${v}`;
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFeatures([]);
    setFeatureInput('');
    reset({ key: '', name: '', description: '', duration_months: 1, price: 0, currency: 'USD', tier: tierFilter === 'all' ? 'normal' : tierFilter, is_enterprise: false, is_active: true });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setFeatures(Array.isArray(p.features) ? [...p.features] : []);
    setFeatureInput('');
    reset({
      key: p.key || '', name: p.name || '', description: p.description || '',
      duration_months: p.duration_months ?? 1, price: Number(p.price) ?? 0,
      currency: p.currency || 'USD', tier: p.tier || 'normal',
      is_enterprise: !!p.is_enterprise, is_active: p.is_active !== false,
    });
    setShowModal(true);
  };

  const addFeature = () => {
    const v = featureInput.trim();
    if (!v) return;
    if (features.includes(v)) return;
    setFeatures((f) => [...f, v]);
    setFeatureInput('');
  };

  const removeFeature = (v) => setFeatures((f) => f.filter((x) => x !== v));

  const onSubmit = async (form) => {
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        duration_months: Number(form.duration_months),
        price: Number(form.price),
        currency: (form.currency || 'USD').toUpperCase(),
        tier: form.tier || 'normal',
        is_enterprise: !!form.is_enterprise,
        is_active: !!form.is_active,
        features,
      };
      if (editing) {
        await api.patch(`/plans/${editing.id}`, payload);
      } else {
        await api.post('/plans', { key: form.key.trim(), ...payload });
      }
      setShowModal(false);
      fetchPlans();
    } catch (err) {
      addToast(err.response?.data?.message || t('admin.plans.saveError'), 'error');
    }
  };

  const toggleActive = async (p) => {
    try {
      await api.patch(`/plans/${p.id}`, { is_active: !p.is_active });
      fetchPlans();
    } catch (err) {
      addToast(err.response?.data?.message || t('admin.plans.saveError'), 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/plans/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchPlans();
    } catch (err) {
      addToast(err.response?.data?.message || t('admin.plans.deleteError'), 'error');
    }
  };

  const err = (m) => (m ? <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>{String(m?.message || m)}</p> : null);
  const inputCls = 'w-full px-4 py-3 rounded-xl outline-none min-h-[48px]';
  const inputStyle = { background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' };

  return (
    <div className="page animate-fadeInUp overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="page-header !mb-0">
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight" style={{ color: 'var(--color-text-primary)' }}>{t('admin.plans.title')}</h1>
          <p className="text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>{t('admin.plans.subtitle')}</p>
        </div>
        <button onClick={openCreate} className="btn-primary py-3 px-6 text-base rounded-2xl shadow-xl active:scale-[0.98] min-h-[48px] w-full md:w-auto justify-center">
          <Plus size={20} /> {t('admin.plans.addNew')}
        </button>
      </div>

      {/* Filtro por tier: Normal / Premium */}
      <div
        className="inline-flex p-1.5 rounded-2xl shadow-lg self-start"
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        role="tablist"
        aria-label={t('admin.plans.tier')}
      >
        {[
          { v: 'all', label: t('admin.plans.filterAll') },
          { v: 'normal', label: t('admin.plans.tierNormal') },
          { v: 'premium', label: t('admin.plans.tierPremium') },
        ].map(({ v, label }) => {
          const active = tierFilter === v;
          return (
            <button
              key={v}
              role="tab"
              aria-selected={active}
              onClick={() => setTierFilter(v)}
              className="px-6 py-2.5 rounded-xl font-black text-sm transition-all min-h-[44px]"
              style={active
                ? { background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))', color: 'white' }
                : { background: 'transparent', color: 'var(--color-text-muted)' }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="card shadow-2xl overflow-hidden rounded-[1.5rem]" style={{ padding: 0, border: '1px solid var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="table-admin w-full min-w-[920px]">
            <thead>
              <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                {[t('admin.plans.name'), t('admin.plans.tier'), t('admin.plans.duration'), t('admin.plans.price'), t('admin.plans.services'), t('admin.plans.enterprise'), t('admin.plans.active'), t('admin.referrals.actions')].map((h) => (
                  <th key={h} scope="col" className="text-left text-xs font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent mx-auto" role="status" aria-label="Loading plans" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}></div></td></tr>
              ) : visiblePlans.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-base" style={{ color: 'var(--color-text-muted)' }}>{t('admin.plans.noData')}</td></tr>
              ) : visiblePlans.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                  <td>
                    <p className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{p.name}</p>
                    <p className="text-xs mt-1 font-mono" style={{ color: 'var(--color-text-muted)' }}>{p.key || '—'}</p>
                    {p.description && <p className="text-xs mt-1 max-w-[220px] truncate" style={{ color: 'var(--color-text-muted)' }}>{p.description}</p>}
                  </td>
                  <td>
                    <span className="px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest" style={{
                      background: (p.tier || 'normal') === 'premium' ? 'rgba(249,115,22,0.12)' : 'rgba(59,130,246,0.1)',
                      color: (p.tier || 'normal') === 'premium' ? 'var(--color-brand)' : 'var(--color-info)',
                    }}>
                      {(p.tier || 'normal') === 'premium' ? t('admin.plans.tierPremium') : t('admin.plans.tierNormal')}
                    </span>
                  </td>
                  <td className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{p.is_enterprise ? '—' : `${p.duration_months}m`}</td>
                  <td className="font-black" style={{ color: 'var(--color-success)' }}>{p.is_enterprise ? t('pricing.custom') : fmtMoney(p.price, p.currency)}</td>
                  <td>
                    <div className="flex flex-wrap gap-1.5 max-w-[260px]">
                      {(Array.isArray(p.features) ? p.features : []).slice(0, 4).map((f) => (
                        <span key={f} className="text-[11px] font-bold px-2 py-1 rounded-lg" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>{f}</span>
                      ))}
                      {(p.features?.length || 0) > 4 && (
                        <span className="text-[11px] font-black px-2 py-1">+{p.features.length - 4}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest" style={{
                      background: p.is_enterprise ? 'rgba(249,115,22,0.12)' : 'rgba(59,130,246,0.1)',
                      color: p.is_enterprise ? 'var(--color-brand)' : 'var(--color-info)',
                    }}>
                      {p.is_enterprise ? t('admin.plans.enterprise') : 'STD'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleActive(p)}
                      className="px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest min-h-[44px]"
                      style={{
                        background: p.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: p.is_active ? 'var(--color-success)' : 'var(--color-error)',
                      }}
                      aria-label={`${p.is_active ? t('admin.plans.inactive') : t('admin.plans.active')}: ${p.name}`}
                    >
                      {p.is_active ? t('admin.plans.active') : t('admin.plans.inactive')}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(p)} className="p-3 rounded-xl shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-info)' }} aria-label={`Edit ${p.name}`}><Edit2 size={17} /></button>
                      <button onClick={() => setDeleteTarget(p)} className="p-3 rounded-xl shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-error)' }} aria-label={`Delete ${p.name}`}><Trash2 size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} role="dialog" aria-modal="true" aria-label={editing ? t('admin.plans.editTitle') : t('admin.plans.addTitle')}>
          <div className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl p-6 relative max-h-[92dvh] overflow-y-auto" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-3 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }} aria-label="Close dialog"><X size={18} /></button>
            <h3 className="text-lg font-bold mb-5 pr-12" style={{ color: 'var(--color-text-primary)' }}>
              {editing ? t('admin.plans.editTitle') : t('admin.plans.addTitle')} {t('admin.plans.title')}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {!editing && (
                <div>
                  <label htmlFor="plan-key" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('admin.plans.key')} *</label>
                  <input id="plan-key" {...register('key')} className={inputCls} style={inputStyle} placeholder="premium" />
                  {err(errors.key)}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="plan-name" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('admin.plans.name')} *</label>
                  <input id="plan-name" {...register('name')} className={inputCls} style={inputStyle} />
                  {err(errors.name)}
                </div>
                <div>
                  <label htmlFor="plan-duration" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('admin.plans.duration')} *</label>
                  <input id="plan-duration" type="number" min={0} max={120} {...register('duration_months')} className={inputCls} style={inputStyle} />
                  {err(errors.duration_months)}
                </div>
              </div>
              <div>
                <label htmlFor="plan-desc" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('admin.plans.description')}</label>
                <input id="plan-desc" {...register('description')} className={inputCls} style={inputStyle} />
                {err(errors.description)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="plan-price" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('admin.plans.price')} *</label>
                  <input id="plan-price" type="number" step="0.01" min={0} {...register('price')} className={inputCls} style={inputStyle} />
                  {err(errors.price)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="plan-currency" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('admin.plans.currency')}</label>
                    <input id="plan-currency" {...register('currency')} className={inputCls} style={inputStyle} placeholder="USD" maxLength={3} />
                    {err(errors.currency)}
                  </div>
                  <div>
                    <label htmlFor="plan-tier" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('admin.plans.tier')} *</label>
                    <select id="plan-tier" {...register('tier')} className={`${inputCls} cursor-pointer`} style={inputStyle} disabled={!!editing?.is_enterprise}>
                      <option value="normal">{t('admin.plans.tierNormal')}</option>
                      <option value="premium">{t('admin.plans.tierPremium')}</option>
                    </select>
                    {err(errors.tier)}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-3 cursor-pointer min-h-[48px]">
                  <input type="checkbox" {...register('is_enterprise')} className="w-5 h-5" />
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('admin.plans.enterprise')}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer min-h-[48px]">
                  <input type="checkbox" {...register('is_active')} className="w-5 h-5" />
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('admin.plans.active')}</span>
                </label>
              </div>
              <div>
                <span className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('admin.plans.services')}</span>
                <div className="flex flex-wrap gap-2 mb-3">
                  {features.map((f) => (
                    <span key={f} className="flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-xl min-h-[44px]" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>
                      <Tag size={14} aria-hidden="true" /> {f}
                      <button type="button" onClick={() => removeFeature(f)} className="p-1 min-w-[32px] min-h-[32px] flex items-center justify-center" aria-label={`Remove ${f}`}><X size={14} /></button>
                    </span>
                  ))}
                  {features.length === 0 && (
                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>—</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                    className={`${inputCls} flex-1`}
                    style={inputStyle}
                    placeholder={t('admin.plans.servicePlaceholder')}
                    aria-label={t('admin.plans.services')}
                  />
                  <button type="button" onClick={addFeature} className="btn-secondary px-5 min-h-[48px] shrink-0">{t('admin.plans.addService')}</button>
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center min-h-[52px] disabled:opacity-50">
                {editing ? t('admin.plans.update') : t('admin.plans.create')} {t('admin.plans.title')}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t('admin.plans.title')}
        message={t('admin.plans.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
      />
    </div>
  );
}
