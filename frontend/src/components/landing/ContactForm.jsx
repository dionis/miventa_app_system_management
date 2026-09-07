import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';

const schema = z.object({
  full_name: z.string().trim().min(2, 'Name too short').max(120),
  email: z.string().trim().email('Invalid email').max(255),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  company: z.string().trim().max(120).optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Min 10 characters').max(5000),
});

export default function ContactForm() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', email: '', phone: '', company: '', message: '' },
  });

  const onSubmit = async (values) => {
    try {
      await api.post('/leads', values);
      addToast(t('contact.success'), 'success');
      reset();
    } catch {
      addToast(t('contact.error'), 'error');
    }
  };

  const inputCls =
    'w-full px-6 py-4 rounded-2xl outline-none transition-all duration-300 text-base md:text-lg font-medium min-h-[52px]';
  const inputStyle = {
    background: 'var(--color-bg-tertiary)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-primary)',
  };
  const err = (m) =>
    m ? <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>{m}</p> : null;

  return (
    <section id="contact" className="py-20 md:py-32 relative overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
      <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center">
        <div className="max-w-5xl w-full mx-auto">
          <div className="text-center mb-12 md:mb-20 animate-fadeInUp">
            <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              {t('contact.title')} <br />
              <span className="gradient-text">{t('contact.accent')}</span>
            </h2>
            <p className="text-base md:text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {t('contact.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-6 md:space-y-8 p-6 md:p-12 rounded-[2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] relative overflow-hidden animate-fadeInUp" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="cf-name" className="block text-base md:text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('contact.fullName')} *</label>
                <input id="cf-name" type="text" autoComplete="name" {...register('full_name')} className={inputCls} style={inputStyle} placeholder={t('contact.placeholderName')} />
                {err(errors.full_name?.message)}
              </div>
              <div>
                <label htmlFor="cf-email" className="block text-base md:text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('contact.email')} *</label>
                <input id="cf-email" type="email" autoComplete="email" {...register('email')} className={inputCls} style={inputStyle} placeholder={t('contact.placeholderEmail')} />
                {err(errors.email?.message)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="cf-phone" className="block text-base md:text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('contact.phone')}</label>
                <input id="cf-phone" type="tel" autoComplete="tel" {...register('phone')} className={inputCls} style={inputStyle} placeholder={t('contact.placeholderPhone')} />
                {err(errors.phone?.message)}
              </div>
              <div>
                <label htmlFor="cf-company" className="block text-base md:text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('contact.company')}</label>
                <input id="cf-company" type="text" autoComplete="organization" {...register('company')} className={inputCls} style={inputStyle} placeholder={t('contact.placeholderCompany')} />
                {err(errors.company?.message)}
              </div>
            </div>

            <div>
              <label htmlFor="cf-message" className="block text-base md:text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('contact.message')} *</label>
              <textarea id="cf-message" rows={5} {...register('message')} className={`${inputCls} resize-y`} style={inputStyle} placeholder={t('contact.placeholderMessage')} />
              {err(errors.message?.message)}
            </div>

            <div className="pt-2">
              <button
                type="submit" disabled={isSubmitting}
                className="btn-primary w-full justify-center text-lg md:text-xl py-4 md:py-5 disabled:opacity-50 shadow-2xl shadow-orange-500/30 active:scale-[0.99] transition-all font-bold rounded-2xl min-h-[56px]"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-7 w-7 border-4 border-t-transparent border-white" role="status" aria-label="Sending"></div>
                ) : (
                  <><Send size={22} /> {t('contact.submit')}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
