import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle, MailCheck, Send } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import api from '../lib/axios';

const schema = z
  .object({
    first_name: z.string().trim().min(2, 'Min 2').max(60),
    last_name: z.string().trim().min(2, 'Min 2').max(60),
    company: z.string().trim().max(120).optional().or(z.literal('')),
    email: z.string().trim().email('Invalid email').max(255),
    phone: z.string().trim().min(6, 'Min 6').max(40),
    secondary_phone: z.string().trim().max(40).optional().or(z.literal('')),
    password: z
      .string()
      .min(8, 'Min 8')
      .max(128)
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'letters + numbers'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'mismatch',
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const { signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null); // { email, sent }
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      company: '',
      email: '',
      phone: '',
      secondary_phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  if (!loading && user && !done) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const onSubmit = async (v) => {
    setError(null);
    setResent(false);
    try {
      const data = await signUp({
        first_name: v.first_name.trim(),
        last_name: v.last_name.trim(),
        company: v.company?.trim() || undefined,
        email: v.email.trim().toLowerCase(),
        phone: v.phone.trim(),
        secondary_phone: v.secondary_phone?.trim() || undefined,
        password: v.password,
        lang: i18n.language,
      });
      setDone({ email: data?.user?.email || v.email, sent: data?.email_sent });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error');
    }
  };

  const resend = async () => {
    if (!done?.email) return;
    setResending(true);
    try {
      await api.post('/auth/resend-verification', {
        email: done.email,
        lang: i18n.language,
      });
    } catch {
      // respuesta genérica igual
    } finally {
      setResent(true);
      setResending(false);
    }
  };

  const inputCls =
    'w-full px-4 py-3 rounded-xl outline-none transition-all duration-200 min-h-[48px] text-base';
  const inputStyle = {
    background: 'var(--color-bg-tertiary)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-primary)',
  };
  const errMsg = (m) => {
    if (!m) return null;
    const msg = m.message === 'mismatch' ? t('register.mismatch') : m.message;
    return (
      <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>
        {msg}
      </p>
    );
  };
  const F = (id, label, props, error) => (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold mb-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {label}
      </label>
      <input id={id} {...register(id)} {...props} className={inputCls} style={inputStyle} />
      {errMsg(error)}
    </div>
  );

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center p-4 relative"
      style={{
        background: 'var(--color-bg-primary)',
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{
            background:
              'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))',
          }}
        ></div>
      </div>
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <div className="relative w-full max-w-2xl py-10">
        <div className="card !p-6 md:!p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Mi<span className="gradient-text">Venta</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {done ? t('register.successTitle') : t('register.subtitle')}
            </p>
          </div>

          {done ? (
            <div className="text-center space-y-5">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'rgba(16,185,129,0.1)' }}
                aria-hidden="true"
              >
                <MailCheck size={44} style={{ color: 'var(--color-success)' }} />
              </div>
              <p className="text-base" style={{ color: 'var(--color-text-primary)' }}>
                {t('register.successMsg', { email: done.email })}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t('register.noEmailHint')}
              </p>
              {resent && (
                <p className="text-sm font-bold" style={{ color: 'var(--color-success)' }}>
                  {t('register.resentMsg')}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={resend}
                  disabled={resending}
                  className="btn-secondary min-h-[52px] disabled:opacity-50"
                >
                  <Send size={18} /> {t('register.resend')}
                </button>
                <button
                  onClick={() => navigate('/admin/dashboard', { replace: true })}
                  className="btn-primary min-h-[52px]"
                >
                  {t('register.continue')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2
                className="text-xl font-extrabold mb-6"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {t('register.title')}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {F('first_name', `${t('register.firstName')} *`, { autoComplete: 'given-name' }, errors.first_name)}
                  {F('last_name', `${t('register.lastName')} *`, { autoComplete: 'family-name' }, errors.last_name)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {F('company', t('register.company'), { autoComplete: 'organization' }, errors.company)}
                  {F('email', `${t('register.email')} *`, { type: 'email', autoComplete: 'email' }, errors.email)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {F('phone', `${t('register.phone')} *`, { type: 'tel', autoComplete: 'tel' }, errors.phone)}
                  {F('secondary_phone', t('register.secondaryPhone'), { type: 'tel', autoComplete: 'tel' }, errors.secondary_phone)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {F('password', `${t('register.password')} *`, { type: 'password', autoComplete: 'new-password' }, errors.password)}
                  {F('confirmPassword', `${t('register.confirmPassword')} *`, { type: 'password', autoComplete: 'new-password' }, errors.confirmPassword)}
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {t('register.passwordHint')}
                </p>

                {error && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-xl text-sm"
                    role="alert"
                    style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)' }}
                  >
                    <AlertCircle size={16} /> <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full justify-center text-lg py-4 disabled:opacity-50 min-h-[52px]"
                >
                  {isSubmitting ? (
                    <div
                      className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-white"
                      role="status"
                      aria-label="Loading"
                    ></div>
                  ) : (
                    <>
                      <UserPlus size={20} /> {t('register.submit')}
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {t('register.haveAccount')}{' '}
                <Link
                  to="/login"
                  className="font-bold inline-block py-2"
                  style={{ color: 'var(--color-brand)' }}
                >
                  {t('register.signIn')}
                </Link>
              </div>
              <div className="text-center mt-2">
                <Link
                  to="/"
                  className="text-sm inline-block py-2 px-4 min-h-[44px]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  ← {t('login.backToHome')}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
