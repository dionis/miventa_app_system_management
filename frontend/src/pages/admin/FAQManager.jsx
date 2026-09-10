import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, X, Eye, EyeOff, GripVertical } from 'lucide-react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';

export default function FAQManager() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ question: '', answer: '', sort_order: 0, is_published: true });

  const fetchFaqs = useCallback(async () => {
    try {
      const { data } = await api.get('/faqs');
      setFaqs(data || []);
    } catch {
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

  const openCreate = () => {
    setEditingFaq(null);
    setForm({ question: '', answer: '', sort_order: faqs.length, is_published: true });
    setShowModal(true);
  };

  const openEdit = (faq) => {
    setEditingFaq(faq);
    setForm({ question: faq.question, answer: faq.answer, sort_order: faq.sort_order, is_published: faq.is_published });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaq) {
        await api.patch(`/faqs/${editingFaq.id}`, form);
        addToast(t('admin.faqs.updated'), 'success');
      } else {
        await api.post('/faqs', form);
        addToast(t('admin.faqs.created'), 'success');
      }
      setShowModal(false);
      fetchFaqs();
    } catch (err) {
      addToast(err.response?.data?.message || t('admin.faqs.saveError'), 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/faqs/${deleteTarget.id}`);
      addToast(t('admin.faqs.deleted'), 'success');
      setDeleteTarget(null);
      fetchFaqs();
    } catch {
      addToast(t('admin.faqs.deleteError'), 'error');
    }
  };

  const togglePublished = async (faq) => {
    try {
      await api.patch(`/faqs/${faq.id}`, { is_published: !faq.is_published });
      addToast(faq.is_published ? t('admin.faqs.draftMsg') : t('admin.faqs.publishedMsg'), 'success');
      fetchFaqs();
    } catch {
      addToast(t('admin.faqs.updateError'), 'error');
    }
  };

  return (
    <div className="page animate-fadeInUp overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="page-header !mb-0">
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight" style={{ color: 'var(--color-text-primary)' }}>{t('admin.faqs.title')}</h1>
          <p className="text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>{t('admin.faqs.subtitle')}</p>
        </div>
        <button onClick={openCreate} className="btn-primary py-3 px-6 text-base rounded-2xl shadow-xl active:scale-[0.98] min-h-[48px] w-full md:w-auto justify-center">
          <Plus size={20} /> {t('admin.faqs.addNew')}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}></div></div>
      ) : faqs.length === 0 ? (
        <div className="card text-center py-24 text-lg shadow-xl" style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>{t('admin.faqs.noData')}</div>
      ) : (
        <div className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.id} className="card flex items-start gap-6 shadow-lg hover:shadow-xl transition-all duration-300" style={{ padding: '2rem', border: '1px solid var(--color-border)' }}>
              <GripVertical size={24} className="mt-1 shrink-0 cursor-grab opacity-30 hover:opacity-100 transition-opacity" style={{ color: 'var(--color-text-muted)' }} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>{faq.question}</h3>
                    <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => togglePublished(faq)} className="p-3 rounded-xl transition-all active:scale-95 shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ background: 'var(--color-bg-secondary)', color: faq.is_published ? 'var(--color-success)' : 'var(--color-text-muted)' }} aria-label={faq.is_published ? t('admin.faqs.draft') : t('admin.faqs.published')}>
                      {faq.is_published ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                    <button onClick={() => openEdit(faq)} className="p-3 rounded-xl transition-all active:scale-95 shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-info)' }} aria-label={`${t('admin.faqs.editTitle')} FAQ`}><Edit2 size={20} /></button>
                    <button onClick={() => setDeleteTarget(faq)} className="p-3 rounded-xl transition-all active:scale-95 shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-error)' }} aria-label={`${t('common.delete')} FAQ`}><Trash2 size={20} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-6">
                  <span className="text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-widest" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }}>{t('admin.faqs.order')}: {faq.sort_order}</span>
                  <span className="text-xs px-4 py-1.5 rounded-full font-black uppercase tracking-widest" style={{
                    background: faq.is_published ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: faq.is_published ? 'var(--color-success)' : 'var(--color-error)',
                  }}>
                    {faq.is_published ? t('admin.faqs.published') : t('admin.faqs.draft')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} role="dialog" aria-modal="true" aria-label={editingFaq ? t('admin.faqs.editTitle') : t('admin.faqs.addTitle')}>
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 relative max-h-[92dvh] overflow-y-auto" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-3 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }} aria-label={t('common.close')}><X size={18} /></button>
            <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>{editingFaq ? t('admin.faqs.editTitle') : t('admin.faqs.addTitle')} FAQ</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('admin.faqs.question')} *</label>
                <input type="text" required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full px-4 py-3 rounded-xl outline-none" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('admin.faqs.answer')} *</label>
                <textarea required rows={4} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="w-full px-4 py-3 rounded-xl outline-none resize-none" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('admin.faqs.sortOrder')}</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl outline-none" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer py-3">
                    <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="w-5 h-5 rounded accent-orange-500" />
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('admin.faqs.published')}</span>
                  </label>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full justify-center min-h-[52px]">{editingFaq ? t('admin.faqs.update') : t('admin.faqs.create')} FAQ</button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t('admin.faqs.title')}
        message={t('admin.faqs.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
      />
    </div>
  );
}
