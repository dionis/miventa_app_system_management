import { Mail, Phone, MapPin, Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
    return (
        <footer style={{ background: 'var(--color-bg-sidebar)', color: 'rgba(255, 255, 255, 0.7)' }}>
            <div className="container mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <h3 className="text-2xl font-bold text-white mb-4">
                            Mi<span style={{ color: 'var(--color-brand)' }}>Venta</span>
                        </h3>
                        <p className="text-sm mb-6 leading-relaxed">
                            The all-in-one SaaS platform for service-based startups. Manage subscriptions, referrals, and analytics from a single dashboard.
                        </p>
                        <div className="flex gap-3">
                            {[Github, Twitter, Linkedin].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                                    style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                                >
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Product</h4>
                        <ul className="space-y-3 text-sm">
                            {['Features', 'Pricing', 'FAQ', 'Roadmap'].map((item) => (
                                <li key={item}>
                                    <a href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors duration-300">{item}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Company</h4>
                        <ul className="space-y-3 text-sm">
                            {['About', 'Blog', 'Careers', 'Privacy Policy', 'Terms of Service'].map((item) => (
                                <li key={item}>
                                    <a href="#" className="hover:text-white transition-colors duration-300">{item}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Contact</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center gap-2">
                                <Mail size={16} />
                                <span>hello@miventa.com</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone size={16} />
                                <span>+1 (555) 000-0000</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <MapPin size={16} />
                                <span>San Francisco, CA</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-sm" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <p>© {new Date().getFullYear()} MiVenta. All rights reserved.</p>
                    <p className="mt-2 md:mt-0">
                        Made with <span className="text-red-400">❤</span> for startups everywhere
                    </p>
                </div>
            </div>
        </footer>
    );
}
