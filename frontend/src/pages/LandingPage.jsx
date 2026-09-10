import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Pricing from '../components/landing/Pricing';
import ContactForm from '../components/landing/ContactForm';
import Footer from '../components/landing/Footer';
import PaymentModal from '../components/landing/PaymentModal';
import ThemeToggle from '../components/ThemeToggle';
import { LogIn, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'es' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 hover:bg-white/10 text-sm font-bold min-h-[44px]"
            style={{ color: 'var(--color-text-primary)' }}
            aria-label="Change language"
        >
            <Globe size={18} />
            <span className="uppercase">{i18n.language}</span>
        </button>
    );
};

export default function LandingPage() {
    const { t } = useTranslation();
    const [selectedPlan, setSelectedPlan] = useState(null);

    // Restaurar el plan pendiente tras volver de /login (cambio premium <-> normal)
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('pending_plan');
            if (raw) {
                sessionStorage.removeItem('pending_plan');
                setSelectedPlan(JSON.parse(raw));
            }
        } catch {
            // ignorar plan corrupto
        }
    }, []);

    const handleSelectPlan = (plan) => {
        try {
            sessionStorage.setItem('pending_plan', JSON.stringify(plan));
        } catch {
            // ignorar
        }
        setSelectedPlan(plan);
    };

    const handleCloseModal = () => {
        try {
            sessionStorage.removeItem('pending_plan');
        } catch {
            // ignorar
        }
        setSelectedPlan(null);
    };

    const navItems = [
        { key: 'features', href: '#features', label: t('nav.features') },
        { key: 'pricing', href: '#pricing', label: t('nav.pricing') },
        { key: 'contact', href: '#contact', label: t('nav.contact') },
    ];

    return (
        <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/5">
                <div className="container mx-auto px-4 md:px-8 py-4 md:py-5 flex items-center justify-between">
                    <a href="#" className="text-3xl font-black tracking-tighter" style={{ color: 'var(--color-text-primary)' }}>
                        Mi<span className="gradient-text">Venta</span>
                    </a>

                    <div className="hidden md:flex items-center gap-12">
                        {navItems.map((item) => (
                            <a
                                key={item.key}
                                href={item.href}
                                className="text-lg font-bold transition-all duration-300 hover:text-orange-500 hover:translate-y-[-2px]"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 md:gap-5">
                        <LanguageSwitcher />
                        <ThemeToggle />
                        <Link
                            to="/login"
                            className="btn-primary text-base py-2.5 px-6 shadow-xl shadow-orange-500/20"
                        >
                            <LogIn size={20} />
                            <span className="hidden sm:inline">{t('nav.signIn')}</span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Sections */}
            <div className="pt-20">
                <Hero />
                <Features />
                <Pricing onSelectPlan={handleSelectPlan} />
                <ContactForm />
                <Footer />
            </div>

            {/* Payment Modal */}
            {selectedPlan && (
                <PaymentModal plan={selectedPlan} onClose={handleCloseModal} />
            )}
        </div>
    );
}
