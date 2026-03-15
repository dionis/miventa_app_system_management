import { Mail, Phone, MapPin, Github, Twitter, Linkedin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
    const { t } = useTranslation();

    return (
        <footer style={{ background: 'var(--color-bg-sidebar)', color: 'rgba(255, 255, 255, 0.7)' }}>
            <div className="container mx-auto px-6 py-20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <h3 className="text-3xl font-black text-white mb-6">
                            Mi<span style={{ color: 'var(--color-brand)' }}>Venta</span>
                        </h3>
                        <p className="text-base mb-8 leading-relaxed">
                            {t('footer.description')}
                        </p>
                        <div className="flex gap-4">
                            {[Github, Twitter, Linkedin].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-white/20"
                                    style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                                >
                                    <Icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-white text-lg font-black mb-6">{t('footer.product')}</h4>
                        <ul className="space-y-4 text-base font-medium">
                            {[
                                { label: t('nav.features'), href: '#features' },
                                { label: t('nav.pricing'), href: '#pricing' },
                                { label: t('sidebar.faqs'), href: '#faqs' },
                            ].map((item) => (
                                <li key={item.label}>
                                    <a href={item.href} className="hover:text-white transition-colors duration-300">{item.label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-white text-lg font-black mb-6">{t('footer.company')}</h4>
                        <ul className="space-y-4 text-base font-medium">
                            {['About', 'Blog', 'Careers', 'Privacy Policy', 'Terms of Service'].map((item) => (
                                <li key={item}>
                                    <a href="#" className="hover:text-white transition-colors duration-300">{item}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white text-lg font-black mb-6">{t('footer.contact')}</h4>
                        <ul className="space-y-4 text-base font-medium">
                            <li className="flex items-center gap-3">
                                <Mail size={18} />
                                <span>hello@miventa.com</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} />
                                <span>+1 (555) 000-0000</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <MapPin size={18} />
                                <span>San Francisco, CA</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-16 pt-10 flex flex-col md:flex-row items-center justify-between text-base font-medium" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <p>© {new Date().getFullYear()} MiVenta. {t('footer.rights')}</p>
                    <p className="mt-4 md:mt-0 flex items-center gap-2">
                        {t('footer.madeWith')} <span className="text-orange-500 text-xl">❤</span> {t('footer.forStartups')}
                    </p>
                </div>
            </div>
        </footer>
    );
}
