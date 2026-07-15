import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Check, ArrowRight, Crown, MessageCircle } from 'lucide-react';
import api from '../../lib/axios';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '1234567890';

const FALLBACK_PLANS = [
  { id: '1', key: 'monthly', duration_months: 1, price: 29.99, is_enterprise: false },
  { id: '2', key: 'quarterly', duration_months: 3, price: 76.47, is_enterprise: false },
  { id: '3', key: 'semiannual', duration_months: 6, price: 134.96, is_enterprise: false },
  { id: '4', key: 'annual', duration_months: 12, price: 233.88, is_enterprise: false },
  { id: '5', key: 'enterprise', duration_months: 0, price: 0, is_enterprise: true },
];

export default function Pricing({ onSelectPlan }) {
  const { t, i18n } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    try {
      const { data } = await api.get('/dashboard/plans');
      setPlans(data);
    } catch {
      setPlans(FALLBACK_PLANS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans, i18n.language]);

  const getMonthlyPrice = (plan) => {
    if (plan.is_enterprise || plan.duration_months === 0) return null;
    return (plan.price / plan.duration_months).toFixed(2);
  };

  const isPopular = (plan) => plan.duration_months === 12;

  if (loading) {
    return (
      <section id="pricing" className="py-24" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="container mx-auto px-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}></div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-24" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-7xl font-black mb-6">
            {t('pricing.title')} <span className="gradient-text">{t('pricing.accent')}</span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {t('pricing.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-10 max-w-[95rem] mx-auto">
          {plans.map((plan) => {
            const popular = isPopular(plan);
            const monthlyPrice = getMonthlyPrice(plan);
            const planName = plan.key ? t(`pricing.plans.${plan.key}.name`) : plan.name;
            const planFeatures = plan.key
              ? t(`pricing.plans.${plan.key}.features`, { returnObjects: true })
              : (Array.isArray(plan.features) ? plan.features : []);

            return (
              <div key={plan.id} className="relative rounded-3xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-3 w-full sm:w-[calc(50%-1.25rem)] lg:w-[calc(33.33%-1.75rem)] xl:w-[calc(20%-2rem)] min-w-[280px] max-w-sm" style={{
                background: plan.is_enterprise ? 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' : 'var(--color-bg-card)',
                border: popular ? '4px solid var(--color-brand)' : '1px solid var(--color-border)',
                boxShadow: popular ? '0 25px 50px rgba(249, 115, 22, 0.25)' : 'var(--shadow-lg)',
                color: plan.is_enterprise ? 'white' : 'var(--color-text-primary)',
              }}>
                {popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest text-white flex items-center gap-2 shadow-xl z-10 whitespace-nowrap" style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' }}>
                    <Crown size={16} /> {t('pricing.popular')}
                  </div>
                )}
                <h3 className="text-2xl md:text-3xl font-black mb-3 break-words leading-tight">{planName}</h3>
                {!plan.is_enterprise && <p className="text-base font-bold mb-8 opacity-80" style={{ color: plan.is_enterprise ? 'rgba(255,255,255,0.8)' : 'var(--color-text-muted)' }}>{plan.duration_months} {plan.duration_months === 1 ? t('pricing.month') : t('pricing.months')}</p>}
                {plan.is_enterprise && <p className="text-base font-bold mb-8 opacity-80" style={{ color: 'rgba(255,255,255,0.8)' }}>{t('pricing.customPricing')}</p>}
                {!plan.is_enterprise ? (
                  <div className="mb-10">
                    <div className="flex items-baseline gap-1 flex-wrap"><span className="text-xl font-bold">$</span><span className="text-5xl md:text-6xl font-black">{plan.price}</span></div>
                    {monthlyPrice && <div className="text-base font-bold mt-2 opacity-60" style={{ color: plan.is_enterprise ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)' }}>(${monthlyPrice}/{t('pricing.mo')})</div>}
                  </div>
                ) : <div className="mb-10"><span className="text-4xl md:text-6xl font-black break-words">{t('pricing.custom')}</span></div>}
                <ul className="flex-1 space-y-5 mb-12">
                  {(Array.isArray(planFeatures) ? planFeatures : []).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-4 text-base">
                      <Check size={20} className="mt-1 shrink-0" style={{ color: plan.is_enterprise ? 'white' : 'var(--color-success)' }} />
                      <span className="font-bold leading-snug break-words hyphens-auto">{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.is_enterprise ? (
                  <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi! I'm interested in the Enterprise plan.`} target="_blank" rel="noopener noreferrer" className="w-full py-5 px-4 rounded-2xl font-black text-lg md:text-xl text-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-2xl flex items-center justify-center gap-2" style={{ background: 'white', color: 'var(--color-brand)' }}>
                    <MessageCircle size={22} className="shrink-0" /> <span className="break-words">{t('pricing.contactSales')}</span>
                  </a>
                ) : (
                  <button onClick={() => onSelectPlan?.(plan)} className="w-full py-5 px-4 rounded-2xl font-black text-lg md:text-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-2xl flex items-center justify-center gap-2" style={{
                    background: popular ? 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' : 'var(--color-bg-tertiary)',
                    color: popular ? 'white' : 'var(--color-text-primary)',
                  }}>
                    <span className="break-words">{t('pricing.getStarted')}</span> <ArrowRight size={22} className="shrink-0" />
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
