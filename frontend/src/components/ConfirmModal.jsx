import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel, cancelLabel, variant }) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const confirmColor = isDanger ? 'var(--color-error)' : 'var(--color-brand)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md rounded-2xl p-8 relative text-center" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 p-3 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }} aria-label={t('common.close')}>
          <X size={18} />
        </button>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `${confirmColor}20`, color: confirmColor }} aria-hidden="true">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
        <p className="text-base mb-8" style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-[1.02] min-h-[52px]" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>
            {cancelLabel || t('common.cancel')}
          </button>
          <button onClick={onConfirm} className="flex-1 py-4 rounded-2xl font-bold text-lg text-white transition-all hover:scale-[1.02] min-h-[52px]" style={{ background: confirmColor }}>
            {confirmLabel || t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  variant: PropTypes.oneOf(['danger', 'default']),
};
