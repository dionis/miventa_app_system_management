import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Loader2, CheckCircle, QrCode, LogIn, Copy, Check, Mail, Download } from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';

export default function PaymentModal({ plan, onClose }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [qrData, setQrData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [license, setLicense] = useState(null);
  const [copied, setCopied] = useState(false);
  const [emailState, setEmailState] = useState('idle');

  useEffect(() => {
    if (!plan) return;
    // P0: exigir login. Antes se enviaba un UUID falso 000... que creaba basura huérfana.
    if (!user) {
      setStatus('auth_required');
      return;
    }
    let cancelled = false;

    async function createOrder() {
      try {
        setStatus('loading');
        // P0: solo plan_id. El user_id lo toma el backend del JWT.
        const { data } = await api.post('/payments/create-order', {
          plan_id: plan.id,
        });
        if (cancelled) return;
        setQrData(data);
        setStatus('pending');
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || t('payment.createOrderFailed'));
        setStatus('error');
      }
    }

    createOrder();
    return () => { cancelled = true; };
  }, [plan, user, t]);

  useEffect(() => {
    if (!qrData) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/payments/${qrData.payment_id}/status`);
        if (data.status === 'completed') {
          if (data.license) setLicense(data.license);
          else if (data.license_key) setLicense({ license_key: data.license_key });
          setStatus('completed');
          clearInterval(interval);
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [qrData]);

  const licenseKey = license?.license_key || null;

  const copyKey = async () => {
    if (!licenseKey) return;
    try {
      await navigator.clipboard.writeText(licenseKey);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = licenseKey;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* noop */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmail = async () => {
    if (!qrData?.payment_id) return;
    setEmailState('sending');
    try {
      await api.post(`/licenses/${qrData.payment_id}/resend-email`);
      setEmailState('sent');
    } catch {
      setEmailState('error');
    }
    setTimeout(() => setEmailState('idle'), 3000);
  };

  const downloadKey = () => {
    if (!licenseKey) return;
    const blob = new Blob([`MiVenta - Llave de licencia\nPlan: ${plan?.name ?? ''}\nLlave: ${licenseKey}\n`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'licencia-miventa.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const goToLogin = () => {
    // Persistir el plan elegido: LandingPage se desmonta al ir a /login
    try {
      sessionStorage.setItem('pending_plan', JSON.stringify(plan));
    } catch {
      // storage no disponible: continuar igual
    }
    onClose?.();
    navigate('/login');
  };

  const retry = () => {
    setQrData(null);
    setError(null);
    setStatus('loading');
    api.post('/payments/create-order', { plan_id: plan.id })
      .then(({ data }) => { setQrData(data); setStatus('pending'); })
      .catch((err) => { setError(err.response?.data?.message || t('payment.createOrderFailed')); setStatus('error'); });
  };

  if (!plan) return null;

  // Cambio de plan: avisar de qué plan viene el usuario
  const activeSub = profile?.subscriptions?.find((s) => s.status === 'active') || profile?.subscriptions?.[0] || null;
  const switching = !!activeSub && activeSub.plan_id !== plan.id;
  const fromName = activeSub?.plans?.name || null;

  const fmtMoney = (value, currency) => {
    try {
      return new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: currency || plan.currency || 'USD',
        minimumFractionDigits: 2,
      }).format(Number(value) || 0);
    } catch {
      return `$${value}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }} role="dialog" aria-modal="true" aria-label={t('payment.title')}>
      <div className="relative w-full max-w-md rounded-2xl p-8" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg transition-all duration-300 hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }} aria-label="Close">
          <X size={18} />
        </button>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' }} aria-hidden="true">
            <QrCode size={32} color="white" />
          </div>
          <h3 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('payment.title')}</h3>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>{plan.name} — {fmtMoney(plan.price, plan.currency)}</p>
          {switching && (
            <p className="text-xs mt-3 px-4 py-2 rounded-xl inline-block" role="status" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--color-info)' }}>
              {t('payment.switchNotice', { from: fromName || '—', to: plan.name })}
            </p>
          )}
        </div>

        {status === 'auth_required' && (
          <div className="flex flex-col items-center py-8 text-center">
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              {t('payment.signInRequired')}
            </p>
            <button onClick={goToLogin} className="btn-primary min-h-[48px]">
              <LogIn size={18} /> {t('payment.goToLogin')}
            </button>
          </div>
        )}

        {status === 'loading' && (
          <div className="flex flex-col items-center py-12">
            <Loader2 size={48} className="animate-spin" style={{ color: 'var(--color-brand)' }} role="status" aria-label={t('payment.generatingQR')} />
            <p className="mt-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('payment.generatingQR')}</p>
          </div>
        )}

        {status === 'pending' && qrData && (
          <div className="flex flex-col items-center">
            <div className="p-4 rounded-2xl mb-6" style={{ background: 'white' }}>
              <img src={qrData.qr_code} alt="QR" className="w-56 h-56" />
            </div>
            <div className="text-center mb-6">
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('payment.transactionRef')}</p>
              <p className="font-mono font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{qrData.transaction_ref}</p>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl" style={{ background: 'rgba(245, 158, 11, 0.1)' }} role="status">
              <div className="relative" aria-hidden="true">
                <div className="w-3 h-3 rounded-full animate-ping absolute" style={{ background: 'var(--color-warning)', opacity: 0.4 }}></div>
                <div className="w-3 h-3 rounded-full relative" style={{ background: 'var(--color-warning)' }}></div>
              </div>
              <span className="font-medium text-sm" style={{ color: 'var(--color-warning)' }}>{t('payment.waitingPayment')}</span>
            </div>
          </div>
        )}

        {status === 'completed' && (
          <div className="flex flex-col items-center py-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(16, 185, 129, 0.1)' }} aria-hidden="true">
              <CheckCircle size={48} style={{ color: 'var(--color-success)' }} />
            </div>
            <h4 className="text-xl font-bold mb-2" style={{ color: 'var(--color-success)' }}>{t('payment.paymentSuccessful')}</h4>
            <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>{t('payment.welcomeAboard')}</p>
            {licenseKey ? (
              <div className="w-full mt-6 p-4 rounded-2xl" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
                <p className="text-xs mb-2 text-center" style={{ color: 'var(--color-text-muted)' }}>{t('payment.licenseKey')}</p>
                <p className="font-mono font-bold text-sm text-center break-all select-all" style={{ color: 'var(--color-text-primary)' }}>{licenseKey}</p>
                {(license?.license_type || license?.pos_count) && (
                  <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    {license?.license_type ?? ''}{license?.pos_count ? ` · ${license.pos_count} POS` : ''}{license?.days ? ` · ${license.days} días` : ''}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  <button onClick={copyKey} className="btn-secondary min-h-[44px] flex items-center gap-2">
                    {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? t('payment.copied') : t('payment.copyKey')}
                  </button>
                  <button onClick={sendEmail} disabled={emailState === 'sending'} className="btn-secondary min-h-[44px] flex items-center gap-2">
                    <Mail size={16} /> {emailState === 'sent' ? t('payment.emailSent') : emailState === 'sending' ? t('payment.sending') : t('payment.sendEmail')}
                  </button>
                  <button onClick={downloadKey} className="btn-secondary min-h-[44px] flex items-center gap-2" aria-label={t('payment.downloadKey')}>
                    <Download size={16} />
                  </button>
                </div>
                {emailState === 'error' && (
                  <p className="text-xs mt-2 text-center" role="alert" style={{ color: 'var(--color-warning)' }}>{t('payment.emailFailed')}</p>
                )}
              </div>
            ) : (
              <p className="text-sm mt-4 text-center" style={{ color: 'var(--color-text-muted)' }}>{t('payment.licensePending')}</p>
            )}
            <button onClick={onClose} className="btn-primary mt-6 min-h-[48px]">{t('payment.continue')}</button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-8">
            <p className="text-center mb-4" role="alert" style={{ color: 'var(--color-error)' }}>{error}</p>
            <button onClick={retry} className="btn-primary min-h-[48px]">
              {t('payment.tryAgain')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

PaymentModal.propTypes = {
  plan: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    currency: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};
