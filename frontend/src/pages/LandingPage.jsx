import { useState } from 'react';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Pricing from '../components/landing/Pricing';
import ContactForm from '../components/landing/ContactForm';
import Footer from '../components/landing/Footer';
import PaymentModal from '../components/landing/PaymentModal';
import ThemeToggle from '../components/ThemeToggle';
import { LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    const [selectedPlan, setSelectedPlan] = useState(null);

    return (
        <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-40 glass">
                <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                    <a href="#" className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                        Mi<span className="gradient-text">Venta</span>
                    </a>
                    <div className="hidden md:flex items-center gap-8">
                        {['Features', 'Pricing', 'Contact'].map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase()}`}
                                className="text-sm font-medium transition-colors duration-200 hover:text-indigo-500"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                {item}
                            </a>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <ThemeToggle />
                        <Link
                            to="/login"
                            className="btn-primary text-sm py-2 px-3 md:px-5"
                        >
                            <LogIn size={16} />
                            <span className="hidden sm:inline">Sign In</span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Sections */}
            <Hero />
            <Features />
            <Pricing onSelectPlan={setSelectedPlan} />
            <ContactForm />
            <Footer />

            {/* Payment Modal */}
            {selectedPlan && (
                <PaymentModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
            )}
        </div>
    );
}
