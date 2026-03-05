import { useState, useEffect } from 'react';
import { Check, ArrowRight, Crown, MessageCircle } from 'lucide-react';
import api from '../../lib/axios';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '1234567890';

export default function Pricing({ onSelectPlan }) {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const { data } = await api.get('/dashboard/plans');
            setPlans(data);
        } catch {
            // Fallback plans if API is not available
            setPlans([
                { id: '1', name: 'Monthly', duration_months: 1, price: 29.99, is_enterprise: false, features: ['All core features', 'Email support', '1 user seat'] },
                { id: '2', name: 'Quarterly', duration_months: 3, price: 76.47, is_enterprise: false, features: ['All core features', 'Priority support', '3 user seats', 'Analytics dashboard'] },
                { id: '3', name: 'Semiannual', duration_months: 6, price: 134.96, is_enterprise: false, features: ['All core features', 'Priority support', '5 user seats', 'Analytics dashboard', 'API access'] },
                { id: '4', name: 'Annual', duration_months: 12, price: 233.88, is_enterprise: false, features: ['All core features', 'Dedicated support', '10 user seats', 'Analytics dashboard', 'API access', 'Custom integrations'] },
                { id: '5', name: 'Enterprise', duration_months: 0, price: 0, is_enterprise: true, features: ['Unlimited users', '24/7 dedicated support', 'Custom integrations', 'SLA guarantee', 'On-premise option'] },
            ]);
        } finally {
            setLoading(false);
        }
    };

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
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        Simple, transparent <span className="gradient-text">pricing</span>
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                        Choose the plan that fits your needs. All plans include our core features.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
                    {plans.map((plan) => {
                        const popular = isPopular(plan);
                        const monthlyPrice = getMonthlyPrice(plan);
                        const planFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;

                        return (
                            <div
                                key={plan.id}
                                className="relative rounded-2xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-2"
                                style={{
                                    background: plan.is_enterprise
                                        ? 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))'
                                        : 'var(--color-bg-card)',
                                    border: popular ? '2px solid var(--color-brand)' : '1px solid var(--color-border)',
                                    boxShadow: popular ? '0 0 30px rgba(99, 102, 241, 0.2)' : 'var(--shadow-sm)',
                                    color: plan.is_enterprise ? 'white' : 'var(--color-text-primary)',
                                }}
                            >
                                {/* Popular badge */}
                                {popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold text-white flex items-center gap-1" style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' }}>
                                        <Crown size={14} /> Most Popular
                                    </div>
                                )}

                                {/* Plan name */}
                                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>

                                {/* Duration */}
                                {!plan.is_enterprise && (
                                    <p className="text-sm mb-4" style={{ color: plan.is_enterprise ? 'rgba(255,255,255,0.8)' : 'var(--color-text-muted)' }}>
                                        {plan.duration_months} {plan.duration_months === 1 ? 'month' : 'months'}
                                    </p>
                                )}
                                {plan.is_enterprise && (
                                    <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>Custom pricing</p>
                                )}

                                {/* Price */}
                                {!plan.is_enterprise ? (
                                    <div className="mb-6">
                                        <span className="text-4xl font-bold">${plan.price}</span>
                                        {monthlyPrice && (
                                            <span className="text-sm ml-2" style={{ color: plan.is_enterprise ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)' }}>
                                                (${monthlyPrice}/mo)
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mb-6">
                                        <span className="text-4xl font-bold">Custom</span>
                                    </div>
                                )}

                                {/* Features */}
                                <ul className="flex-1 space-y-3 mb-8">
                                    {(planFeatures || []).map((feature) => (
                                        <li key={feature} className="flex items-start gap-2 text-sm">
                                            <Check size={16} className="mt-0.5 shrink-0" style={{ color: plan.is_enterprise ? 'white' : 'var(--color-success)' }} />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                {plan.is_enterprise ? (
                                    <a
                                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi! I'm interested in the Enterprise plan.`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 px-4 rounded-xl font-semibold text-center transition-all duration-300 hover:opacity-90 flex items-center justify-center gap-2"
                                        style={{ background: 'white', color: 'var(--color-brand)' }}
                                    >
                                        <MessageCircle size={18} />
                                        Contact Sales
                                    </a>
                                ) : (
                                    <button
                                        onClick={() => onSelectPlan?.(plan)}
                                        className="w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 hover:opacity-90 flex items-center justify-center gap-2"
                                        style={{
                                            background: popular ? 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' : 'var(--color-bg-tertiary)',
                                            color: popular ? 'white' : 'var(--color-text-primary)',
                                        }}
                                    >
                                        Get Started
                                        <ArrowRight size={16} />
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
