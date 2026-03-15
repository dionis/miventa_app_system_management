import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard, Users, UserPlus, HelpCircle,
    FileText, LogOut, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const { t } = useTranslation();

    const menuItems = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard') },
        { path: '/admin/referrals', icon: UserPlus, label: t('sidebar.referrals') },
        { path: '/admin/users', icon: Users, label: t('sidebar.users') },
        { path: '/admin/faqs', icon: HelpCircle, label: t('sidebar.faqs') },
        { path: '/admin/logs', icon: FileText, label: t('sidebar.logs') },
    ];

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside
                className={`fixed md:sticky top-0 h-screen z-50 flex flex-col transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{
                    width: collapsed ? '80px' : '280px',
                    background: 'var(--color-bg-sidebar)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                }}
            >
                {/* Logo */}
                <div className="px-8 py-8 flex items-center justify-between">
                    {!collapsed && (
                        <span className="text-2xl font-black text-white tracking-tighter">
                            Mi<span style={{ color: 'var(--color-brand)' }}>Venta</span>
                        </span>
                    )}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="hidden md:block p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300"
                        >
                            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        </button>
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="md:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Menu */}
                <nav className="flex-1 px-4 space-y-4 overflow-y-auto mt-4">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-5 py-4.5 rounded-2xl transition-all duration-300 ${isActive
                                    ? 'text-white font-bold shadow-xl shadow-orange-500/10 scale-[1.02]'
                                    : 'text-white/60 hover:text-white hover:bg-white/5 font-medium'
                                }`
                            }
                            style={({ isActive }) =>
                                isActive
                                    ? { background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' }
                                    : {}
                            }
                        >
                            <item.icon size={22} className="shrink-0" />
                            {!collapsed && <span className="text-lg tracking-wide">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User section */}
                <div className="px-4 pb-8 mt-auto">
                    <div
                        className="flex items-center gap-4 px-5 py-4 rounded-2xl mb-3 border border-white/5"
                        style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                    >
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' }}>
                            {profile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-bold text-white truncate">{profile?.full_name || 'Admin'}</p>
                                <p className="text-xs font-semibold text-white/30 uppercase tracking-widest truncate">{profile?.role || 'admin'}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-4 px-5 py-4.5 rounded-2xl w-full text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300 justify-start hover:scale-[1.02]"
                    >
                        <LogOut size={22} className="flex-shrink-0" />
                        {!collapsed && <span className="text-lg font-medium">{t('sidebar.signOut')}</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
