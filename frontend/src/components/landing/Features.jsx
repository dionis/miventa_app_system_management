import { BarChart3, Shield, Users, CreditCard, LineChart, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Features() {
  const { t } = useTranslation();

  const features = [
    { icon: BarChart3, title: t('features.analytics.title'), description: t('features.analytics.description') },
    { icon: Shield, title: t('features.security.title'), description: t('features.security.description') },
    { icon: Users, title: t('features.referral.title'), description: t('features.referral.description') },
    { icon: CreditCard, title: t('features.payments.title'), description: t('features.payments.description') },
    { icon: LineChart, title: t('features.growth.title'), description: t('features.growth.description') },
    { icon: Globe, title: t('features.multiplatform.title'), description: t('features.multiplatform.description') },
  ];

  return (
    <section id="features" className="py-24 relative" style={{ background: 'var(--color-bg-secondary)' }}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black mb-6">
            {t('features.title1')} <span className="gradient-text">{t('features.title2')}</span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {t('features.subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={feature.title} className="card group cursor-pointer p-8 rounded-3xl" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 shadow-lg" style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' }}>
                <feature.icon size={28} color="white" />
              </div>
              <h3 className="text-2xl font-black mb-4" style={{ color: 'var(--color-text-primary)' }}>{feature.title}</h3>
              <p className="text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
