import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Eye, EyeOff, GripVertical } from 'lucide-react';
import api from '../../lib/axios';

export default function FAQManager() {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingFaq, setEditingFaq] = useState(null);
    const [form, setForm] = useState({ question: '', answer: '', sort_order: 0, is_published: true });

    useEffect(() => { fetchFaqs(); }, []);

    const fetchFaqs = async () => {
        try {
            const { data } = await api.get('/faqs');
            setFaqs(data || []);
        } catch {
            setFaqs([]);
        } finally {
            setLoading(false);
        }
    };

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
            } else {
                await api.post('/faqs', form);
            }
            setShowModal(false);
            fetchFaqs();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving FAQ');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this FAQ?')) return;
        try {
            await api.delete(`/faqs/${id}`);
            fetchFaqs();
        } catch {
            alert('Error deleting FAQ');
        }
    };

    const togglePublished = async (faq) => {
        try {
            await api.patch(`/faqs/${faq.id}`, { is_published: !faq.is_published });
            fetchFaqs();
        } catch {
            alert('Error updating FAQ');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>FAQ Manager</h1>
                    <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>Manage frequently asked questions for the public site</p>
                </div>
                <button onClick={openCreate} className="btn-primary">
                    <Plus size={18} /> Add FAQ
                </button>
            </div>

            {/* FAQ Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-t-transparent" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}></div></div>
            ) : faqs.length === 0 ? (
                <div className="card text-center py-12" style={{ color: 'var(--color-text-muted)' }}>No FAQs yet. Create your first one!</div>
            ) : (
                <div className="space-y-4">
                    {faqs.map((faq) => (
                        <div key={faq.id} className="card flex items-start gap-4" style={{ padding: '1.25rem' }}>
                            <GripVertical size={20} className="mt-1 shrink-0 cursor-grab" style={{ color: 'var(--color-text-muted)' }} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{faq.question}</h3>
                                        <p className="text-sm mt-2 whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>{faq.answer}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => togglePublished(faq)} className="p-2 rounded-lg transition-all hover:scale-110" style={{ background: 'var(--color-bg-tertiary)', color: faq.is_published ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                                            {faq.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                        <button onClick={() => openEdit(faq)} className="p-2 rounded-lg transition-all hover:scale-110" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-info)' }}><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(faq.id)} className="p-2 rounded-lg transition-all hover:scale-110" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-error)' }}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-3">
                                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}>Order: {faq.sort_order}</span>
                                    <span className="text-xs px-2 py-1 rounded-full" style={{
                                        background: faq.is_published ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: faq.is_published ? 'var(--color-success)' : 'var(--color-error)',
                                    }}>
                                        {faq.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                    <div className="w-full max-w-lg rounded-2xl p-8 relative" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 rounded-lg" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}><X size={18} /></button>
                        <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>{editingFaq ? 'Edit' : 'Add'} FAQ</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Question *</label>
                                <input type="text" required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full px-4 py-3 rounded-xl outline-none" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Answer *</label>
                                <textarea required rows={4} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="w-full px-4 py-3 rounded-xl outline-none resize-none" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Sort Order</label>
                                    <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl outline-none" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-3 cursor-pointer py-3">
                                        <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="w-5 h-5 rounded accent-indigo-500" />
                                        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Published</span>
                                    </label>
                                </div>
                            </div>
                            <button type="submit" className="btn-primary w-full justify-center">{editingFaq ? 'Update' : 'Create'} FAQ</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
