import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Loader2, CheckCircle, QrCode, Copy, Check, Mail, Download, MessageSquare, MessageCircle, Tag, Pencil, FlaskConical, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';

export default function PaymentModal({ plan, onClose }) {
  const { user, profile } = useAuth();
  const { t, i18n } = useTranslation();
  // form: se muestra primero (guest: contacto obligatorio; logueado: solo referido opcional)
  const [step, setStep] = useState('form');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState('email');
  const [referralCode, setReferralCode] = useState('');
  const [referralInfo, setReferralInfo] = useState(null);
  const [referralError, setReferralError] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState(null);
  const [license, setLicense] = useState(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [notifyState, setNotifyState] = useState('idle');
  const [notifyMsg, setNotifyMsg] = useState(null);
  const [claimPassword, setClaimPassword] = useState('');
  const [claimName, setClaimName] = useState('');
  const [claimState, setClaimState] = useState('idle');
  // Carga de la llave en éxito (reintento si aún no llegó)
  const [keyLoading, setKeyLoading] = useState(false);
  const [keyError, setKeyError] = useState(null);
  const [keyDetail, setKeyDetail] = useState(null);
  // Edición del QR ya creado (sin regenerar) + simulación demo de la pasarela
  const [editing, setEditing] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [simCountdown, setSimCountdown] = useState(7);
  const [simState, setSimState] = useState('idle'); // idle | running | done | error | cancelled
  const [simError, setSimError] = useState(null);

  if (!plan) return null;

  const activeSub = profile?.subscriptions?.find((s) => s.status === 'active') || profile?.subscriptions?.[0] || null;
  const switching = !!activeSub && !!user && activeSub.plan_id !== plan.id;
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

  const checkReferral = async () => {
    const code = referralCode.trim().toUpperCase();
    if (!code) {
      setReferralInfo(null);
      setReferralError(null);
      return;
    }
    try {
      const { data } = await api.get(`/referrals/validate/${encodeURIComponent(code)}`);
      setReferralInfo(data);
      setReferralError(null);
    } catch {
      setReferralInfo(null);
      setReferralError(t('payment.invalidReferral'));
    }
  };

  const startOrder = async (e) => {
    e?.preventDefault?.();
    setError(null);
    // Modo edición: el QR ya existe, solo se guardan los datos de contacto.
    if (editing && qrData) {
      await saveContact(e);
      return;
    }
    // Canal "none": no hace falta validar ningún contacto.
    if (!user && channel !== 'none' && !email.trim() && !phone.trim()) {
      setError(t('payment.contactRequired'));
      return;
    }
    setStep('loading');
    try {
      const body = { plan_id: plan.id };
      const code = referralCode.trim().toUpperCase();
      if (code) body.referral_code = code;
      let data;
      if (user) {
        // Logueado: usa JWT; el claim_token vuelve en la respuesta para polling/notify.
        if (channel) body.contact_channel = channel;
        ({ data } = await api.post('/payments/create-order', body));
      } else {
        if (email.trim()) body.email = email.trim();
        if (phone.trim()) body.phone = phone.trim();
        body.contact_channel = channel;
        ({ data } = await api.post('/payments/guest-order', body));
      }
      setQrData(data);
      setStatus('pending');
      setEditing(false);
      setSimCountdown(7);
      setSimState('idle');
      setSimError(null);
      setStep('pending');
    } catch (err) {
      setError(err.response?.data?.message || t('payment.createOrderFailed'));
      setStep('form');
    }
  };

  // Guarda email/teléfono/canal del QR ya creado SIN generar otro QR.
  const saveContact = async (e) => {
    e?.preventDefault?.();
    if (!qrData?.payment_id) return;
    if (channel !== 'none' && !email.trim() && !phone.trim()) {
      setError(t('payment.contactRequired'));
      return;
    }
    setSavingContact(true);
    setError(null);
    try {
      const { data } = await api.patch(`/payments/${qrData.payment_id}/contact`, {
        claim: qrData.claim_token,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        channel,
      });
      setQrData((prev) => ({ ...prev, ...data }));
      setEditing(false);
      setStep('pending');
    } catch (err) {
      setError(err.response?.data?.message || t('payment.saveContactFailed'));
    } finally {
      setSavingContact(false);
    }
  };

  const goEdit = () => {
    setEditing(true);
    setError(null);
    setStep('form');
  };

  const backToQr = () => {
    setEditing(false);
    setError(null);
    setStep('pending');
  };

  // Llave válida SOLO si es string con formato real. Sin llave NO hay
  // copiar/compartir/descargar/enviar: esas acciones exigen hasKey.
  const extractKey = (data) => {
    const k = data?.license?.license_key || data?.license_key || null;
    return typeof k === 'string' && k.length > 10 ? k : null;
  };
  const applyResult = (data) => {
    const k = extractKey(data);
    if (k) {
      const base = data?.license && typeof data.license === 'object' ? data.license : {};
      setLicense({ ...base, license_key: k });
    }
    if (data?.account_created) setAccountCreated(true);
    if (data?.licenseReason || data?.licenseError) {
      setKeyDetail(data.licenseReason || data.licenseError);
    }
    return !!k;
  };

  // La llave SIEMPRE se muestra en éxito: si aún no llegó (webhook en
  // camino), se reintenta leer el estado y, con claim, se completa la
  // confirmación idempotente (misma secuencia del webhook).
  const loadLicense = async (silent = false) => {
    if (!qrData?.payment_id || license) return true;
    if (!silent) {
      setKeyLoading(true);
      setKeyError(null);
    }
    try {
      let data;
      if (qrData.claim_token) {
        ({ data } = await api.get(`/payments/${qrData.payment_id}/public-status`, {
          params: { claim: qrData.claim_token },
        }));
      } else {
        ({ data } = await api.get(`/payments/${qrData.payment_id}/status`));
      }
      if (applyResult(data)) return true;
      // Confirmado pero sin llave: generarla vía idempotente.
      if (data?.status === 'completed' && qrData.claim_token) {
        const { data: sim } = await api.post(`/payments/${qrData.payment_id}/simulate`, {
          claim: qrData.claim_token,
        });
        if (applyResult(sim)) return true;
      }
      return false;
    } catch (err) {
      if (!silent) setKeyError(err.response?.data?.message || t('payment.keyLoadFailed'));
      return false;
    } finally {
      if (!silent) setKeyLoading(false);
    }
  };

  // Al entrar a éxito sin llave: reintento automático cada 3s (hasta 8 veces).
  useEffect(() => {
    if (step !== 'completed' || license) return;
    let tries = 0;
    loadLicense(true);
    const interval = setInterval(async () => {
      tries += 1;
      const ok = await loadLicense(true);
      if (ok || tries >= 8) clearInterval(interval);
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, qrData]);
  const runSimulation = async () => {
    if (!qrData?.payment_id || simState === 'running' || simState === 'done') return;
    setSimState('running');
    setSimError(null);
    try {
      const { data } = await api.post(`/payments/${qrData.payment_id}/simulate`, {
        claim: qrData.claim_token,
      });
      applyResult(data);
      setSimState('done');
      setStatus('completed');
      setStep('completed');
    } catch (err) {
      // Si el pago ya se completó por el webhook real, el polling lo recoge.
      setSimState('error');
      setSimError(err.response?.data?.message || t('payment.simulateFailed'));
    }
  };
  useEffect(() => {
    if (step !== 'pending' || !qrData) return;
    const interval = setInterval(async () => {
      try {
        let data;
        if (qrData.claim_token) {
          ({ data } = await api.get(`/payments/${qrData.payment_id}/public-status`, {
            params: { claim: qrData.claim_token },
          }));
        } else {
          ({ data } = await api.get(`/payments/${qrData.payment_id}/status`));
        }
        if (data.status === 'completed') {
          applyResult(data);
          setStatus('completed');
          setStep('completed');
          clearInterval(interval);
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [step, qrData]);

  // Cuenta regresiva de 7s: al llegar a 0 se dispara la simulación sola.
  // Desactivable con VITE_PAYMENT_SIMULATE=false.
  useEffect(() => {
    if (step !== 'pending' || !qrData?.claim_token) return;
    if (import.meta.env.VITE_PAYMENT_SIMULATE === 'false') return;
    if (simState !== 'idle') return;
    if (simCountdown <= 0) {
      runSimulation();
      return;
    }
    const timer = setTimeout(() => setSimCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, qrData, simCountdown, simState]);

  // Puerta estricta: sin llave válida NO se puede copiar/compartir/descargar/enviar.
  const hasKey = typeof license?.license_key === 'string' && license.license_key.length > 10;
  const licenseKey = hasKey ? license.license_key : null;
  const shareText = licenseKey
    ? `${t('payment.shareText')}: ${licenseKey}`
    : '';
  const whatsappHref = licenseKey
    ? `https://wa.me/?text=${encodeURIComponent(shareText)}`
    : null;

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const copyText = async (text, done) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* noop */ }
      document.body.removeChild(ta);
    }
    done();
  };

  const copyKey = () => {
    if (!licenseKey) return;
    copyText(licenseKey, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyRef = () => {
    const ref = qrData?.transaction_ref;
    if (!ref) return;
    copyText(ref, () => {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    });
  };

  const shareKey = async () => {
    if (!licenseKey || !navigator.share) return;
    try {
      await navigator.share({ title: t('payment.licenseKey'), text: shareText });
    } catch {
      // cancelado por el usuario: no hacer nada
    }
  };

  const sendNotify = async (e) => {
    e?.preventDefault?.();
    if (!qrData?.payment_id) return;
    setNotifyState('sending');
    setNotifyMsg(null);
    try {
      const { data } = await api.post(`/payments/${qrData.payment_id}/notify`, {
        claim: qrData.claim_token,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        channel,
      });
      setNotifyState('sent');
      setNotifyMsg(
        data?.emailed || data?.smsSent
          ? t('payment.notifySent')
          : t('payment.notifyPending', { reason: data?.emailReason || data?.smsReason || '' }),
      );
    } catch (err) {
      setNotifyState('error');
      setNotifyMsg(err.response?.data?.message || t('payment.emailFailed'));
    }
    setTimeout(() => setNotifyState('idle'), 4000);
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

  const claimAccount = async (e) => {
    e?.preventDefault?.();
    if (!qrData?.payment_id) return;
    setClaimState('sending');
    try {
      await api.post(`/payments/${qrData.payment_id}/claim-account`, {
        claim: qrData.claim_token,
        password: claimPassword,
        full_name: claimName.trim() || undefined,
      });
      setClaimState('sent');
    } catch {
      setClaimState('error');
    }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl outline-none min-h-[48px] text-base';
  const inputStyle = { background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }} role="dialog" aria-modal="true" aria-label={t('payment.title')}>
      <div className="relative w-full max-w-md rounded-2xl p-8 max-h-[92dvh] overflow-y-auto" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg transition-all duration-300 hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }} aria-label="Close">
          <X size={18} />
        </button>
        <div className="text-center mb-6">
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

        {step === 'form' && (
          <form onSubmit={startOrder} className="space-y-4">
            {editing && qrData && (
              <p className="text-xs px-4 py-3 rounded-xl text-center font-bold" role="status" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--color-info)' }}>
                {t('payment.editingNotice', { ref: qrData.transaction_ref })}
              </p>
            )}
            {!user && (
              <>
                <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>{t('payment.guestHint')}</p>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('payment.email')}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} style={inputStyle} placeholder="tu@correo.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('payment.phone')}</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} style={inputStyle} placeholder="+591 70000000" />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('payment.notifyChannel')}</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className={inputCls} style={inputStyle}>
                <option value="email">{t('payment.channelEmail')}</option>
                <option value="sms">{t('payment.channelSms')}</option>
                <option value="both">{t('payment.channelBoth')}</option>
                <option value="none">{t('payment.channelNone')}</option>
              </select>
              {channel === 'none' && (
                <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>{t('payment.channelNoneHint')}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                <Tag size={14} className="inline mr-1" />{t('payment.referralCode')} ({t('payment.optional')})
              </label>
              <div className="flex gap-2">
                <input value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} onBlur={checkReferral} disabled={editing} className={`${inputCls} font-mono uppercase disabled:opacity-50`} style={inputStyle} placeholder="REF-XXXXXX" maxLength={32} />
                <button type="button" onClick={checkReferral} disabled={editing} className="btn-secondary px-4 min-h-[48px] shrink-0 disabled:opacity-50">{t('payment.apply')}</button>
              </div>
              {editing && (
                <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>{t('payment.referralLocked')}</p>
              )}
              {referralInfo?.valid && (
                <p className="text-xs mt-2 font-bold" style={{ color: 'var(--color-success)' }}>
                  {t('payment.referralOk', { pct: referralInfo.discount_percent })}
                </p>
              )}
              {referralError && (
                <p className="text-xs mt-2" role="alert" style={{ color: 'var(--color-error)' }}>{referralError}</p>
              )}
            </div>
            {error && <p className="text-sm text-center" role="alert" style={{ color: 'var(--color-error)' }}>{error}</p>}
            {editing && qrData ? (
              <div className="flex flex-col gap-2">
                <button type="submit" disabled={savingContact} className="btn-primary w-full justify-center min-h-[52px] disabled:opacity-50">
                  {savingContact ? t('payment.sending') : t('payment.saveWithoutNewQr')}
                </button>
                <button type="button" onClick={backToQr} className="btn-secondary w-full justify-center min-h-[48px]">
                  {t('payment.backToQr')}
                </button>
              </div>
            ) : (
              <button type="submit" className="btn-primary w-full justify-center min-h-[52px]">{t('payment.generateQR')}</button>
            )}
          </form>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center py-12">
            <Loader2 size={48} className="animate-spin" style={{ color: 'var(--color-brand)' }} role="status" aria-label={t('payment.generatingQR')} />
            <p className="mt-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('payment.generatingQR')}</p>
          </div>
        )}

        {step === 'pending' && qrData && (
          <div className="flex flex-col items-center">
            <div className="p-4 rounded-2xl mb-6" style={{ background: 'white' }}>
              <img src={qrData.qr_code} alt="QR" className="w-56 h-56" />
            </div>
            <div className="text-center mb-4">
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('payment.transactionRef')}</p>
              <p className="font-mono font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{qrData.transaction_ref}</p>
            </div>
            {(qrData.discount_percent > 0 || qrData.amount_original) && (
              <p className="text-sm mb-4 font-bold text-center" style={{ color: 'var(--color-success)' }}>
                {t('payment.discountApplied', { pct: qrData.discount_percent, amount: fmtMoney(qrData.amount, qrData.currency) })}
              </p>
            )}
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl" style={{ background: 'rgba(245, 158, 11, 0.1)' }} role="status">
              <div className="relative" aria-hidden="true">
                <div className="w-3 h-3 rounded-full animate-ping absolute" style={{ background: 'var(--color-warning)', opacity: 0.4 }}></div>
                <div className="w-3 h-3 rounded-full relative" style={{ background: 'var(--color-warning)' }}></div>
              </div>
              <span className="font-medium text-sm" style={{ color: 'var(--color-warning)' }}>{t('payment.waitingPayment')}</span>
            </div>
            <button onClick={goEdit} className="btn-secondary mt-4 min-h-[44px] flex items-center gap-2">
              <Pencil size={16} /> {t('payment.editData')}
            </button>
            {import.meta.env.VITE_PAYMENT_SIMULATE !== 'false' && simState !== 'done' && (
              <div className="w-full mt-4 p-4 rounded-2xl text-center" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
                <p className="text-xs font-bold flex items-center justify-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <FlaskConical size={14} /> {t('payment.simulateTitle')}
                </p>
                {simState === 'idle' && (
                  <>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {t('payment.simulateCountdown', { seconds: simCountdown })}
                    </p>
                    <div className="flex gap-2 justify-center mt-3">
                      <button onClick={runSimulation} className="btn-secondary min-h-[44px]">{t('payment.simulateNow')}</button>
                      <button onClick={() => setSimState('cancelled')} className="btn-secondary min-h-[44px]">{t('payment.simulateCancel')}</button>
                    </div>
                  </>
                )}
                {simState === 'running' && (
                  <p className="text-xs mt-2 flex items-center justify-center gap-2" style={{ color: 'var(--color-warning)' }}>
                    <Loader2 size={14} className="animate-spin" /> {t('payment.simulateRunning')}
                  </p>
                )}
                {simState === 'cancelled' && (
                  <div className="mt-3">
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('payment.simulateCancelled')}</p>
                    <button onClick={runSimulation} className="btn-secondary mt-2 min-h-[44px]">{t('payment.simulateNow')}</button>
                  </div>
                )}
                {simState === 'error' && (
                  <div className="mt-2">
                    <p className="text-xs" role="alert" style={{ color: 'var(--color-error)' }}>{simError || t('payment.simulateFailed')}</p>
                    <button onClick={() => { setSimState('idle'); setSimCountdown(7); }} className="btn-secondary mt-2 min-h-[44px]">{t('payment.tryAgain')}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 'completed' && (
          <div className="flex flex-col items-center py-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(16, 185, 129, 0.1)' }} aria-hidden="true">
              <CheckCircle size={48} style={{ color: 'var(--color-success)' }} />
            </div>
            <h4 className="text-xl font-bold mb-2" style={{ color: 'var(--color-success)' }}>{t('payment.paymentSuccessful')}</h4>
            <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>{t('payment.welcomeAboard')}</p>
            {accountCreated && (
              <p className="text-sm mt-3 text-center font-bold" style={{ color: 'var(--color-info)' }}>{t('payment.accountCreated')}</p>
            )}
            {hasKey ? (
              <div className="w-full mt-6 p-4 rounded-2xl" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
                <p className="text-xs mb-2 text-center" style={{ color: 'var(--color-text-muted)' }}>{t('payment.licenseKey')}</p>
                <button onClick={copyKey} title={t('payment.copyKey')} className="w-full cursor-pointer rounded-xl px-2 py-1 transition-all active:scale-[0.99]">
                  <span className="font-mono font-bold text-sm text-center break-all select-all block" style={{ color: 'var(--color-text-primary)' }}>{licenseKey}</span>
                  <span className="text-[11px] mt-1 flex items-center justify-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                    {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? t('payment.copied') : t('payment.tapToCopy')}
                  </span>
                </button>
                {/* Copiado fácil mobile (long-press) y desktop (Ctrl+C): textarea seleccionable */}
                <textarea
                  readOnly
                  rows={2}
                  value={licenseKey}
                  aria-label={t('payment.licenseKey')}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => e.target.select()}
                  className="w-full mt-2 px-3 py-2 rounded-xl font-mono text-xs text-center resize-none outline-none"
                  style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                />
                {(license?.license_type || license?.pos_count) && (
                  <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    {license?.license_type ?? ''}{license?.pos_count ? ` · ${license.pos_count} POS` : ''}{license?.days ? ` · ${license.days} días` : ''}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  <button onClick={copyKey} className="btn-secondary min-h-[44px] flex items-center gap-2">
                    {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? t('payment.copied') : t('payment.copyKey')}
                  </button>
                  {canShare && (
                    <button onClick={shareKey} className="btn-secondary min-h-[44px] flex items-center gap-2" aria-label={t('payment.shareKey')}>
                      <Share2 size={16} /> {t('payment.shareKey')}
                    </button>
                  )}
                  {whatsappHref && (
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-secondary min-h-[44px] flex items-center gap-2" aria-label={t('payment.sendWhatsapp')}>
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                  )}
                  <button onClick={downloadKey} className="btn-secondary min-h-[44px] flex items-center gap-2" aria-label={t('payment.downloadKey')}>
                    <Download size={16} />
                  </button>
                </div>
                {qrData?.transaction_ref && (
                  <p className="text-xs mt-3 text-center" style={{ color: 'var(--color-text-muted)' }}>
                    {t('payment.transactionRef')}: <span className="font-mono font-bold">{qrData.transaction_ref}</span>{' '}
                    <button onClick={copyRef} className="underline" aria-label={t('payment.copyKey')}>
                      {copiedRef ? t('payment.copied') : t('payment.copyKey')}
                    </button>
                  </p>
                )}
                <form onSubmit={sendNotify} className="mt-4 space-y-2">
                  <p className="text-xs font-bold text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    <Mail size={12} className="inline mr-1" />{t('payment.notifyTitle')}
                  </p>
                  <div className="flex gap-2">
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} !min-h-[44px] !text-sm`} style={inputStyle} placeholder={user ? t('payment.emailOptional') : 'tu@correo.com'} type="email" />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputCls} !min-h-[44px] !text-sm`} style={inputStyle} placeholder={user ? t('payment.phoneOptional') : 'SMS'} type="tel" />
                  </div>
                  <select value={channel} onChange={(e) => setChannel(e.target.value)} className={`${inputCls} !min-h-[44px] !text-sm`} style={inputStyle} aria-label={t('payment.notifyChannel')}>
                    <option value="email">{t('payment.channelEmail')}</option>
                    <option value="sms">{t('payment.channelSms')}</option>
                    <option value="both">{t('payment.channelBoth')}</option>
                  </select>
                  <button disabled={notifyState === 'sending'} className="btn-secondary w-full justify-center min-h-[44px]">
                    <MessageSquare size={16} /> {notifyState === 'sent' ? t('payment.emailSent') : notifyState === 'sending' ? t('payment.sending') : t('payment.sendLicense')}
                  </button>
                  {notifyMsg && <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>{notifyMsg}</p>}
                </form>
                {accountCreated && claimState !== 'sent' && (
                  <form onSubmit={claimAccount} className="mt-4 space-y-2 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <p className="text-xs font-bold text-center" style={{ color: 'var(--color-text-secondary)' }}>{t('payment.claimTitle')}</p>
                    <input value={claimName} onChange={(e) => setClaimName(e.target.value)} className={`${inputCls} !min-h-[44px] !text-sm`} style={inputStyle} placeholder={t('payment.fullName')} />
                    <input value={claimPassword} onChange={(e) => setClaimPassword(e.target.value)} className={`${inputCls} !min-h-[44px] !text-sm`} style={inputStyle} placeholder={t('payment.newPassword')} type="password" minLength={8} required />
                    <button className="btn-primary w-full justify-center min-h-[44px]">{t('payment.claimAccount')}</button>
                    {claimState === 'error' && <p className="text-xs text-center" role="alert" style={{ color: 'var(--color-error)' }}>{t('payment.claimError')}</p>}
                  </form>
                )}
                {claimState === 'sent' && (
                  <p className="text-xs mt-3 text-center font-bold" style={{ color: 'var(--color-success)' }}>{t('payment.claimOk')}</p>
                )}
              </div>
            ) : (
              <div className="w-full mt-6 p-4 rounded-2xl text-center" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
                <p className="text-sm font-bold flex items-center justify-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                  <Loader2 size={16} className="animate-spin" /> {t('payment.keyGenerating')}
                </p>
                {keyDetail && (
                  <p className="text-[11px] mt-2 font-mono break-all" style={{ color: 'var(--color-text-muted)' }}>{keyDetail}</p>
                )}
                {keyError && (
                  <p className="text-xs mt-2" role="alert" style={{ color: 'var(--color-error)' }}>{keyError}</p>
                )}
                <button onClick={() => loadLicense(false)} disabled={keyLoading} className="btn-secondary mt-3 min-h-[48px] disabled:opacity-50">
                  {keyLoading ? t('payment.sending') : t('payment.keyRetry')}
                </button>
              </div>
            )}
            <button onClick={onClose} className="btn-primary mt-6 min-h-[48px]">{t('payment.continue')}</button>
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
