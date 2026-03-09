import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Users, UserPlus, HelpCircle,
    FileText, LogOut, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/referrals', icon: UserPlus, label: 'Referrals' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/faqs', icon: HelpCircle, label: 'FAQ Manager' },
    { path: '/admin/logs', icon: FileText, label: 'Event Log' },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

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
                    width: collapsed ? '80px' : '260px',
                    background: 'var(--color-bg-sidebar)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                }}
            >
                {/* Logo */}
                <div className="px-6 py-6 flex items-center justify-between">
                    {!collapsed && (
                        <span className="text-xl font-bold text-white tracking-tight">
                            Mi<span style={{ color: 'var(--color-brand)' }}>Venta</span>
                        </span>
                    )}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="hidden md:block p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300"
                        >
                            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </button>
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="md:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Menu */}
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                                    ? 'text-white font-semibold shadow-lg'
                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                                }`
                            }
                            style={({ isActive }) =>
                                isActive
                                    ? { background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' }
                                    : {}
                            }
                        >
                            <item.icon size={20} />
                            {!collapsed && <span className="text-sm">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User section */}
                <div className="px-3 pb-6 mt-auto">
                    <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-2"
                        style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                    >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' }}>
                            {profile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'Admin'}</p>
                                <p className="text-xs text-white/40 capitalize truncate">{profile?.role || 'admin'}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-white/50 hover:text-white hover:bg-white/5 transition-all duration-300 justify-start"
                    >
                        <LogOut size={20} className="flex-shrink-0" />
                        {!collapsed && <span className="text-sm">Sign Out</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
