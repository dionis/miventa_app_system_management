import { NavLink, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, UserPlus, HelpCircle, CreditCard,
  FileText, LogOut, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard') },
    { path: '/admin/plans', icon: CreditCard, label: t('sidebar.plans') },
    { path: '/admin/referrals', icon: UserPlus, label: t('sidebar.referrals') },
    { path: '/admin/users', icon: Users, label: t('sidebar.users') },
    { path: '/admin/faqs', icon: HelpCircle, label: t('sidebar.faqs') },
    { path: '/admin/logs', icon: FileText, label: t('sidebar.logs') },
  ];

  // Mobile: ESC cierra el drawer + bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen, setMobileOpen]);

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
    navigate('/login');
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        aria-label="Admin navigation"
        className={`fixed md:sticky top-0 h-[100dvh] z-50 flex flex-col transition-[width,transform] duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          width: collapsed ? '88px' : 'min(280px, 84vw)',
          background: 'var(--color-bg-sidebar)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="px-5 md:px-8 py-6 flex items-center justify-between">
          {!collapsed && (
            <span className="text-2xl font-black text-white tracking-tighter">
              Mi<span style={{ color: 'var(--color-brand)' }}>Venta</span>
            </span>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-3 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300 items-center justify-center min-w-[44px] min-h-[44px]"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden flex p-3 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300 items-center justify-center min-w-[44px] min-h-[44px]"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 md:px-4 space-y-2 overflow-y-auto mt-2 pb-4" aria-label="Primary">
          {menuItems.map((item) => (
            <NavLink
              key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 md:px-5 min-h-[48px] py-3 rounded-2xl transition-all duration-300 active:scale-[0.98] ${isActive ? 'text-white font-bold shadow-xl shadow-orange-500/10' : 'text-white/60 hover:text-white hover:bg-white/5 font-medium'}`
              }
              style={({ isActive }) => isActive ? { background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' } : undefined}
            >
              <item.icon size={22} className="shrink-0" aria-hidden="true" />
              {!collapsed && <span className="text-base md:text-lg tracking-wide truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 md:px-4 pb-6 mt-auto">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-2 border border-white/5" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0" style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' }} aria-hidden="true">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm md:text-base font-bold text-white truncate">{profile?.full_name || 'Admin'}</p>
                <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest truncate">{profile?.role || 'admin'}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-4 px-4 md:px-5 min-h-[48px] py-3 rounded-2xl w-full text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300 justify-start active:scale-[0.98]"
          >
            <LogOut size={22} className="shrink-0" aria-hidden="true" />
            {!collapsed && <span className="text-base md:text-lg font-medium">{t('sidebar.signOut')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

Sidebar.propTypes = {
  mobileOpen: PropTypes.bool.isRequired,
  setMobileOpen: PropTypes.func.isRequired,
};
