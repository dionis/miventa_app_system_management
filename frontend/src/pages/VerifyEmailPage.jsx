import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle, AlertCircle, Send } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import api from '../lib/axios';

export default function VerifyEmailPage() {
  const { t, i18n } = useTranslation();
  const [params] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const token = params.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    api
      .get('/auth/verify-email', { params: { token } })
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'));
  }, [token]);

  const resend = async () => {
    if (!email.trim()) return;
    setResending(true);
    try {
      await api.post('/auth/resend-verification', {
        email: email.trim().toLowerCase(),
        lang: i18n.language,
      });
    } catch {
      // genérico igual
    } finally {
      setResent(true);
      setResending(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center p-4 relative"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <div className="relative w-full max-w-md">
        <div className="card !p-6 md:!p-10 text-center">
          <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>
            {t('verify.title')}
          </h1>

          {status === 'loading' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 size={44} className="animate-spin" style={{ color: 'var(--color-brand)' }} role="status" aria-label={t('verify.verifying')} />
              <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>
                {t('verify.verifying')}
              </p>
            </div>
          )}

          {status === 'ok' && (
            <div className="flex flex-col items-center py-6 space-y-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.1)' }}
                aria-hidden="true"
              >
                <CheckCircle size={44} style={{ color: 'var(--color-success)' }} />
              </div>
              <p className="font-bold" style={{ color: 'var(--color-success)' }}>
                {t('verify.success')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link to="/" className="btn-secondary min-h-[52px]">
                  {t('verify.backHome')}
                </Link>
                <Link to="/login" className="btn-primary min-h-[52px]">
                  {t('verify.goPanel')}
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center py-6 space-y-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.1)' }}
                aria-hidden="true"
              >
                <AlertCircle size={44} style={{ color: 'var(--color-error)' }} />
              </div>
              <p className="font-bold" role="alert" style={{ color: 'var(--color-error)' }}>
                {t('verify.failed')}
              </p>
              <div className="w-full space-y-3 pt-2">
                <label
                  htmlFor="verify-email"
                  className="block text-sm font-semibold text-left"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {t('verify.emailLabel')}
                </label>
                <input
                  id="verify-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl outline-none min-h-[48px]"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <button
                  onClick={resend}
                  disabled={resending || !email.trim()}
                  className="btn-primary w-full justify-center min-h-[52px] disabled:opacity-50"
                >
                  <Send size={18} /> {t('verify.resend')}
                </button>
                {resent && (
                  <p className="text-sm font-bold" style={{ color: 'var(--color-success)' }}>
                    {t('register.resentMsg')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
