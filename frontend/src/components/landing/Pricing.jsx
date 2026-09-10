import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Check, ArrowRight, Crown, MessageCircle } from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '1234567890';

const FALLBACK_PLANS = [
  { id: '1', key: 'monthly', tier: 'normal', name: 'Monthly', duration_months: 1, price: 29.99, currency: 'USD', is_enterprise: false, is_active: true },
  { id: '2', key: 'quarterly', tier: 'normal', name: 'Quarterly', duration_months: 3, price: 76.47, currency: 'USD', is_enterprise: false, is_active: true },
  { id: '3', key: 'semiannual', tier: 'normal', name: 'Semiannual', duration_months: 6, price: 134.96, currency: 'USD', is_enterprise: false, is_active: true },
  { id: '4', key: 'annual', tier: 'normal', name: 'Annual', duration_months: 12, price: 233.88, currency: 'USD', is_enterprise: false, is_active: true },
  { id: '5', key: 'premium-monthly', tier: 'premium', name: 'Monthly', duration_months: 1, price: 49.99, currency: 'USD', is_enterprise: false, is_active: true },
  { id: '6', key: 'premium-quarterly', tier: 'premium', name: 'Quarterly', duration_months: 3, price: 127.47, currency: 'USD', is_enterprise: false, is_active: true },
  { id: '7', key: 'premium-semiannual', tier: 'premium', name: 'Semiannual', duration_months: 6, price: 224.96, currency: 'USD', is_enterprise: false, is_active: true },
  { id: '8', key: 'premium-annual', tier: 'premium', name: 'Annual', duration_months: 12, price: 399.99, currency: 'USD', is_enterprise: false, is_active: true },
  { id: '9', key: 'enterprise', tier: 'normal', name: 'Enterprise', duration_months: 0, price: 0, currency: 'USD', is_enterprise: true, is_active: true },
];

/** Tier de un plan (DB nueva trae `tier`; fallback por clave/nombre). */
function resolveTier(plan) {
  if (plan.tier === 'premium' || plan.tier === 'normal') return plan.tier;
  const key = String(plan.key || '');
  if (key.startsWith('premium')) return 'premium';
  return 'normal';
}

/** DB antigua sin columna `key` → derivar desde el nombre.
 * OJO: 'semiannual' contiene 'annual' como subcadena: comprobar 'semi' ANTES. */
function resolveKey(plan) {
  if (plan.key === 'premium') return 'premium-annual'; // DB anterior a migración 003
  if (plan.key) return plan.key;
  const n = String(plan.name || '').toLowerCase();
  if (n.includes('semi')) return 'semiannual';
  if (n.includes('quarter') || n.includes('trimest')) return 'quarterly';
  if (n.includes('premium')) return 'premium';
  if (plan.is_enterprise || n.includes('enterprise') || n.includes('empresarial')) return 'enterprise';
  if (n.includes('annual') || n.includes('anual') || n.includes('year') || n.includes('año')) return 'annual';
  return 'monthly';
}

export default function Pricing({ onSelectPlan }) {
  const { t, i18n } = useTranslation();
  const { user, profile } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState('normal'); // switcher Normal <-> Premium

  const fetchPlans = useCallback(async () => {
    try {
      const { data } = await api.get('/dashboard/plans');
      const list = Array.isArray(data) && data.length ? data : FALLBACK_PLANS;
      // Garantizar catálogo completo por tier aunque la DB aún no tenga migraciones
      const keys = new Set(list.map((p) => p.key || resolveKey(p)));
      const merged = [...list];
      for (const fb of FALLBACK_PLANS) {
        if (!keys.has(fb.key)) merged.push(fb);
      }
      setPlans(merged);
    } catch {
      setPlans(FALLBACK_PLANS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans, i18n.language]);

  const fmtMoney = (value, currency) => {
    try {
      return new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: 2,
      }).format(Number(value) || 0);
    } catch {
      return `$${value}`;
    }
  };

  const getMonthlyPrice = (plan) => {
    if (plan.is_enterprise || !plan.duration_months) return null;
    const v = Number(plan.price) / Number(plan.duration_months);
    try {
      return new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: plan.currency || 'USD',
        minimumFractionDigits: 2,
      }).format(v);
    } catch {
      return `$${v.toFixed(2)}`;
    }
  };

  const planName = (plan) => {
    const key = resolveKey(plan);
    const translated = t(`pricing.plans.${key}.name`, { defaultValue: '' });
    return translated || plan.name;
  };

  const planFeatures = (plan) => {
    const key = resolveKey(plan);
    const translated = t(`pricing.plans.${key}.features`, { returnObjects: true, defaultValue: [] });
    if (Array.isArray(translated) && translated.length) return translated;
    return Array.isArray(plan.features) ? plan.features : [];
  };

  const isPopular = (plan) =>
    tier === 'premium' ? resolveKey(plan) === 'premium-annual' : resolveKey(plan) === 'annual';

  // Plan actual del usuario (para mostrar cambio standard -> premium)
  const activeSub = user
    ? (profile?.subscriptions?.find((s) => s.status === 'active') || profile?.subscriptions?.[0] || null)
    : null;
  const currentPlanId = activeSub?.plan_id || null;
  const isCurrent = (plan) => !!currentPlanId && currentPlanId === plan.id;

  if (loading) {
    return (
      <section id="pricing" className="py-24" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="container mx-auto px-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto" role="status" aria-label="Loading plans" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}></div>
        </div>
      </section>
    );
  }

  // Planes visibles según el tier del switcher (+ Enterprise siempre)
  const visiblePlans = plans.filter(
    (p) => p.is_enterprise || resolveTier(p) === tier,
  );

  return (
    <section id="pricing" className="py-24" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-5xl md:text-7xl font-black mb-6">
            {t('pricing.title')} <span className="gradient-text">{t('pricing.accent')}</span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {t('pricing.subtitle')}
          </p>
        </div>
        {/* Switcher Normal <-> Premium */}
        <div className="flex flex-col items-center gap-3 mb-14">
          <div
            className="inline-flex p-1.5 rounded-2xl shadow-lg"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            role="tablist"
            aria-label={`${t('pricing.tierNormal')} / ${t('pricing.tierPremium')}`}
          >
            {['normal', 'premium'].map((v) => {
              const active = tier === v;
              return (
                <button
                  key={v}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTier(v)}
                  className="px-8 md:px-12 py-3.5 rounded-xl font-black text-base md:text-lg transition-all duration-300 min-h-[52px] min-w-[130px] md:min-w-[170px]"
                  style={active
                    ? { background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))', color: 'white', boxShadow: '0 8px 20px -5px rgba(249,115,22,0.4)' }
                    : { background: 'transparent', color: 'var(--color-text-muted)' }}
                >
                  {v === 'normal' ? t('pricing.tierNormal') : t('pricing.tierPremium')}
                </button>
              );
            })}
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            {t('pricing.tierSubtitle')}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-10 max-w-[95rem] mx-auto" key={tier}>
          {visiblePlans.map((plan) => {
            const popular = isPopular(plan);
            const monthlyPrice = getMonthlyPrice(plan);

            return (
              <div key={plan.id} className="relative rounded-3xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-3 w-full sm:w-[calc(50%-1.25rem)] lg:w-[calc(33.33%-1.75rem)] min-w-[280px] max-w-sm" style={{
                background: plan.is_enterprise ? 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' : 'var(--color-bg-card)',
                border: popular ? '4px solid var(--color-brand)' : '1px solid var(--color-border)',
                boxShadow: popular ? '0 25px 50px rgba(249, 115, 22, 0.25)' : 'var(--shadow-lg)',
                color: plan.is_enterprise ? 'white' : 'var(--color-text-primary)',
              }}>
                {popular && !isCurrent(plan) && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest text-white flex items-center gap-2 shadow-xl z-10 whitespace-nowrap" style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' }}>
                    <Crown size={16} /> {t('pricing.popular')}
                  </div>
                )}
                {isCurrent(plan) && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest text-white flex items-center gap-2 shadow-xl z-10 whitespace-nowrap" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    <Check size={16} /> {t('pricing.currentPlan')}
                  </div>
                )}
                <h3 className="text-2xl md:text-3xl font-black mb-3 break-words leading-tight">{planName(plan)}</h3>
                {!plan.is_enterprise && <p className="text-base font-bold mb-8 opacity-80" style={{ color: 'var(--color-text-muted)' }}>{plan.duration_months} {plan.duration_months === 1 ? t('pricing.month') : t('pricing.months')}</p>}
                {plan.is_enterprise && <p className="text-base font-bold mb-8 opacity-80" style={{ color: 'rgba(255,255,255,0.8)' }}>{t('pricing.customPricing')}</p>}
                {!plan.is_enterprise ? (
                  <div className="mb-10">
                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span className="text-5xl md:text-6xl font-black tracking-tight">{fmtMoney(plan.price, plan.currency)}</span>
                    </div>
                    {monthlyPrice && <div className="text-base font-bold mt-2 opacity-60" style={{ color: 'var(--color-text-muted)' }}>({monthlyPrice}/{t('pricing.mo')})</div>}
                  </div>
                ) : (
                  <div className="mb-10 min-h-[5.5rem] flex items-center">
                    {/* Fix "Personalizado": clamp fluido + hyphenation en vez de 6xl fijo que desborda */}
                    <span
                      className="font-black leading-[1.05] break-words"
                      style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', hyphens: 'auto', overflowWrap: 'anywhere' }}
                      lang={i18n.language}
                    >
                      {t('pricing.custom')}
                    </span>
                  </div>
                )}
                <ul className="flex-1 space-y-5 mb-12">
                  {planFeatures(plan).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-4 text-base">
                      <Check size={20} className="mt-1 shrink-0" style={{ color: plan.is_enterprise ? 'white' : 'var(--color-success)' }} />
                      <span className="font-bold leading-snug break-words hyphens-auto">{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.is_enterprise ? (
                  <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi! I'm interested in the Enterprise plan.`} target="_blank" rel="noopener noreferrer" className="w-full py-5 px-4 rounded-2xl font-black text-lg md:text-xl text-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-2xl flex items-center justify-center gap-2 min-h-[56px]" style={{ background: 'white', color: 'var(--color-brand)' }}>
                    <MessageCircle size={22} className="shrink-0" /> <span className="break-words">{t('pricing.contactSales')}</span>
                  </a>
                ) : isCurrent(plan) ? (
                  <button disabled className="w-full py-5 px-4 rounded-2xl font-black text-lg md:text-xl flex items-center justify-center gap-2 min-h-[56px] opacity-60 cursor-default" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }} aria-current="true">
                    <Check size={22} className="shrink-0" /> <span className="break-words">{t('pricing.currentPlan')}</span>
                  </button>
                ) : (
                  <button onClick={() => onSelectPlan?.(plan)} className="w-full py-5 px-4 rounded-2xl font-black text-lg md:text-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-2xl flex items-center justify-center gap-2 min-h-[56px]" style={{
                    background: popular ? 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' : 'var(--color-bg-tertiary)',
                    color: popular ? 'white' : 'var(--color-text-primary)',
                  }}>
                    <span className="break-words">{currentPlanId ? t('pricing.switchPlan') : t('pricing.getStarted')}</span> <ArrowRight size={22} className="shrink-0" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

Pricing.propTypes = {
  onSelectPlan: PropTypes.func,
};
