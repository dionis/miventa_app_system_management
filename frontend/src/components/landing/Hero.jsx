import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Hero() {
    const { t } = useTranslation();

    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 animate-float" style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' }}></div>
                <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10" style={{ background: 'var(--color-brand)', animationDelay: '1s', animation: 'float 4s ease-in-out infinite' }}></div>
                <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, var(--color-brand) 0%, transparent 70%)' }}></div>
            </div>

            <div className="relative container mx-auto px-6 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="text-left">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full mb-8 animate-fadeInUp shadow-sm" style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                            <Sparkles size={18} />
                            <span className="text-base font-bold tracking-wide uppercase">{t('hero.badge')}</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] animate-fadeInUp tracking-tight" style={{ animationDelay: '0.1s' }}>
                            {t('hero.title1')}
                            <br />
                            <span className="gradient-text">{t('hero.title2')}</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-xl md:text-2xl mb-12 max-w-2xl animate-fadeInUp leading-relaxed" style={{ color: 'var(--color-text-secondary)', animationDelay: '0.2s' }}>
                            {t('hero.subtitle')}
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-6 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                            <a href="#pricing" className="btn-primary text-xl px-10 py-5 w-full sm:w-auto shadow-lg hover:shadow-orange-500/25">
                                {t('hero.getStarted')}
                                <ArrowRight size={22} />
                            </a>
                            <a href="#features" className="btn-secondary text-xl px-10 py-5 w-full sm:w-auto glass hover:bg-white/10">
                                {t('hero.learnMore')}
                            </a>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8 mt-20 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                            {[
                                { value: '10K+', label: t('hero.stats.users') },
                                { value: '99.9%', label: t('hero.stats.uptime') },
                                { value: '24/7', label: t('hero.stats.support') },
                            ].map((stat) => (
                                <div key={stat.label}>
                                    <div className="text-3xl font-extrabold gradient-text mb-1">{stat.value}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-70" style={{ color: 'var(--color-text-secondary)' }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Image Section */}
                    <div className="relative animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
                        <div className="absolute -inset-4 bg-orange-500/20 blur-3xl rounded-full"></div>
                        <img
                            src="/mobile_pos_retail_app_1773592009388.png"
                            alt="MiVenta Mobile POS"
                            className="relative w-full max-w-[500px] mx-auto drop-shadow-2xl animate-float"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
