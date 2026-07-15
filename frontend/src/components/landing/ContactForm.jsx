import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';

export default function ContactForm() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', company: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/leads', form);
      addToast(t('contact.success'), 'success');
      setForm({ full_name: '', email: '', phone: '', company: '', message: '' });
    } catch {
      addToast(t('contact.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-32 relative overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
      <div className="container mx-auto px-6 relative z-10 flex flex-col items-center">
        <div className="max-w-5xl w-full mx-auto">
          <div className="text-center mb-20 animate-fadeInUp">
            <h2 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
              {t('contact.title')} <br />
              <span className="gradient-text">{t('contact.accent')}</span>
            </h2>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {t('contact.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card space-y-10 p-12 md:p-24 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] relative overflow-hidden animate-fadeInUp" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', animationDelay: '0.1s' }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 blur-[100px] pointer-events-none"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="block text-lg font-black" style={{ color: 'var(--color-text-primary)' }}>{t('contact.fullName')} *</label>
                <input type="text" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-6 py-5 rounded-2xl outline-none transition-all duration-300 text-lg font-medium"
                  style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  placeholder={t('contact.placeholderName')}
                />
              </div>
              <div className="space-y-4">
                <label className="block text-lg font-black" style={{ color: 'var(--color-text-primary)' }}>{t('contact.email')} *</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-6 py-5 rounded-2xl outline-none transition-all duration-300 text-lg font-medium"
                  style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  placeholder={t('contact.placeholderEmail')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="block text-lg font-black" style={{ color: 'var(--color-text-primary)' }}>{t('contact.phone')}</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-6 py-5 rounded-2xl outline-none transition-all duration-300 text-lg font-medium"
                  style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  placeholder={t('contact.placeholderPhone')}
                />
              </div>
              <div className="space-y-4">
                <label className="block text-lg font-black" style={{ color: 'var(--color-text-primary)' }}>{t('contact.company')}</label>
                <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full px-6 py-5 rounded-2xl outline-none transition-all duration-300 text-lg font-medium"
                  style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  placeholder={t('contact.placeholderCompany')}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-black" style={{ color: 'var(--color-text-primary)' }}>{t('contact.message')} *</label>
              <textarea required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-6 py-5 rounded-2xl outline-none resize-none transition-all duration-300 text-lg font-medium"
                style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                placeholder={t('contact.placeholderMessage')}
              />
            </div>

            <div className="pt-4">
              <button type="submit" disabled={loading}
                className="btn-primary w-full justify-center text-2xl py-6 disabled:opacity-50 shadow-2xl shadow-orange-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all font-black rounded-3xl"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-transparent border-white"></div>
                ) : (
                  <><Send size={24} /> {t('contact.submit')}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
