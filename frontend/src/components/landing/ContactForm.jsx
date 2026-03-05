import { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../lib/axios';

export default function ContactForm() {
    const [form, setForm] = useState({ full_name: '', email: '', phone: '', company: '', message: '' });
    const [status, setStatus] = useState(null); // 'success' | 'error' | null
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            await api.post('/leads', form);
            setStatus('success');
            setForm({ full_name: '', email: '', phone: '', company: '', message: '' });
        } catch {
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="contact" className="py-24" style={{ background: 'var(--color-bg-secondary)' }}>
            <div className="container mx-auto px-6">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Get in <span className="gradient-text">touch</span>
                        </h2>
                        <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                            Have questions? We'd love to hear from you. Send us a message!
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="card space-y-6" style={{ padding: '2rem' }}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.full_name}
                                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-300 focus:ring-2"
                                    style={{
                                        background: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text-primary)',
                                        '--tw-ring-color': 'var(--color-brand)',
                                    }}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-300 focus:ring-2"
                                    style={{
                                        background: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text-primary)',
                                    }}
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Phone</label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-300 focus:ring-2"
                                    style={{
                                        background: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text-primary)',
                                    }}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Company</label>
                                <input
                                    type="text"
                                    value={form.company}
                                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-300 focus:ring-2"
                                    style={{
                                        background: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text-primary)',
                                    }}
                                    placeholder="Acme Inc."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Message *</label>
                            <textarea
                                required
                                rows={4}
                                value={form.message}
                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl outline-none resize-none transition-all duration-300 focus:ring-2"
                                style={{
                                    background: 'var(--color-bg-tertiary)',
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-text-primary)',
                                }}
                                placeholder="Tell us about your project..."
                            />
                        </div>

                        {/* Status */}
                        {status === 'success' && (
                            <div className="flex items-center gap-2 p-4 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
                                <CheckCircle size={20} />
                                <span className="font-medium">Message sent successfully! We'll be in touch soon.</span>
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="flex items-center gap-2 p-4 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)' }}>
                                <AlertCircle size={20} />
                                <span className="font-medium">Something went wrong. Please try again.</span>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full justify-center text-lg py-4 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-white"></div>
                            ) : (
                                <>
                                    Send Message
                                    <Send size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
