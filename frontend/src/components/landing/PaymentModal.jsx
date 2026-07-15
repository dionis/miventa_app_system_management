import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Loader2, CheckCircle, QrCode } from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';

export default function PaymentModal({ plan, onClose }) {
  const { user } = useAuth();
  const [qrData, setQrData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!plan) return;
    let cancelled = false;

    async function createOrder() {
      try {
        setStatus('loading');
        const { data } = await api.post('/payments/create-order', {
          plan_id: plan.id,
          user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        });
        if (cancelled) return;
        setQrData(data);
        setStatus('pending');
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Failed to create order');
        setStatus('error');
      }
    }

    createOrder();
    return () => { cancelled = true; };
  }, [plan, user?.id]);

  useEffect(() => {
    if (!qrData) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/payments/${qrData.payment_id}/status`);
        if (data.status === 'completed') {
          setStatus('completed');
          clearInterval(interval);
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [qrData]);

  if (!plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="relative w-full max-w-md rounded-2xl p-8" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg transition-all duration-300 hover:scale-110" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>
          <X size={18} />
        </button>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' }}>
            <QrCode size={32} color="white" />
          </div>
          <h3 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Complete Payment</h3>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>{plan.name} Plan — ${plan.price}</p>
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center py-12">
            <Loader2 size={48} className="animate-spin" style={{ color: 'var(--color-brand)' }} />
            <p className="mt-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Generating QR code...</p>
          </div>
        )}

        {status === 'pending' && qrData && (
          <div className="flex flex-col items-center">
            <div className="p-4 rounded-2xl mb-6" style={{ background: 'white' }}>
              <img src={qrData.qr_code} alt="Payment QR Code" className="w-56 h-56" />
            </div>
            <div className="text-center mb-6">
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Transaction Reference</p>
              <p className="font-mono font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{qrData.transaction_ref}</p>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
              <div className="relative">
                <div className="w-3 h-3 rounded-full animate-ping absolute" style={{ background: 'var(--color-warning)', opacity: 0.4 }}></div>
                <div className="w-3 h-3 rounded-full relative" style={{ background: 'var(--color-warning)' }}></div>
              </div>
              <span className="font-medium text-sm" style={{ color: 'var(--color-warning)' }}>Waiting for payment...</span>
            </div>
          </div>
        )}

        {status === 'completed' && (
          <div className="flex flex-col items-center py-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <CheckCircle size={48} style={{ color: 'var(--color-success)' }} />
            </div>
            <h4 className="text-xl font-bold mb-2" style={{ color: 'var(--color-success)' }}>Payment Successful!</h4>
            <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>Your subscription has been activated. Welcome aboard!</p>
            <button onClick={onClose} className="btn-primary mt-6">Continue</button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-8">
            <p className="text-center mb-4" style={{ color: 'var(--color-error)' }}>{error}</p>
            <button
              onClick={() => {
                setQrData(null);
                setError(null);
              }}
              className="btn-primary"
            >
              Try Again
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
  }),
  onClose: PropTypes.func.isRequired,
};
