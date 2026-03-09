import { ArrowRight, Sparkles, Zap } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 animate-float" style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' }}></div>
                <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10" style={{ background: 'var(--color-brand)', animationDelay: '1s', animation: 'float 4s ease-in-out infinite' }}></div>
                <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, var(--color-brand) 0%, transparent 70%)' }}></div>
            </div>

            <div className="relative container mx-auto px-6 py-20">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-fadeInUp" style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                        <Sparkles size={16} />
                        <span className="text-sm font-semibold">The Future of Business Management</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                        Manage your business
                        <br />
                        <span className="gradient-text">with superpowers</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto animate-fadeInUp" style={{ color: 'var(--color-text-secondary)', animationDelay: '0.2s' }}>
                        The all-in-one platform that empowers startups and service-based businesses to scale faster with powerful analytics, smart subscriptions, and referral management.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                        <a href="#pricing" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto">
                            Get Started
                            <ArrowRight size={20} />
                        </a>
                        <a href="#features" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto">
                            Learn More
                        </a>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                        {[
                            { value: '10K+', label: 'Active Users' },
                            { value: '99.9%', label: 'Uptime' },
                            { value: '24/7', label: 'Support' },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center p-4 rounded-xl glass">
                                <div className="text-3xl md:text-4xl font-bold gradient-text">{stat.value}</div>
                                <div className="text-sm mt-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
