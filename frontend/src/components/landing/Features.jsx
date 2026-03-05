import { BarChart3, Shield, Users, CreditCard, LineChart, Globe } from 'lucide-react';

const features = [
    {
        icon: BarChart3,
        title: 'Real-time Analytics',
        description: 'Track sales, subscriptions and referral performance with beautiful visual dashboards updated in real-time.',
    },
    {
        icon: Shield,
        title: 'Enterprise Security',
        description: 'Role-based access control, JWT authentication, and audit logging keep your data safe and traceable.',
    },
    {
        icon: Users,
        title: 'Referral System',
        description: 'Built-in referral management with unique codes, tracking, and automated payout calculations.',
    },
    {
        icon: CreditCard,
        title: 'Smart Payments',
        description: 'Dynamic QR code generation, multiple subscription plans, and seamless payment flow integration.',
    },
    {
        icon: LineChart,
        title: 'Growth Insights',
        description: 'Understand your growth trajectory with monthly analytics, conversion tracking, and KPI monitoring.',
    },
    {
        icon: Globe,
        title: 'Multi-Platform',
        description: 'Responsive design works flawlessly on desktop, tablet, and mobile with dark mode support.',
    },
];

export default function Features() {
    return (
        <section id="features" className="py-24 relative" style={{ background: 'var(--color-bg-secondary)' }}>
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        Everything you need to <span className="gradient-text">succeed</span>
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                        Powerful features designed for modern service-based startups. Scale your business with confidence.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            className="card group cursor-pointer"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                                style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' }}
                            >
                                <feature.icon size={24} color="white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                                {feature.title}
                            </h3>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
