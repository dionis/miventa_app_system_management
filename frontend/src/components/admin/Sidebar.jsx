import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Users, UserPlus, HelpCircle,
    FileText, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/referrals', icon: UserPlus, label: 'Referrals' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/faqs', icon: HelpCircle, label: 'FAQ Manager' },
    { path: '/admin/logs', icon: FileText, label: 'Event Log' },
];

export default function Sidebar() {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <aside
            className="h-screen sticky top-0 flex flex-col transition-all duration-300"
            style={{
                width: collapsed ? '80px' : '260px',
                background: 'var(--color-bg-sidebar)',
                borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            }}
        >
            {/* Logo */}
            <div className="px-6 py-6 flex items-center justify-between">
                {!collapsed && (
                    <span className="text-xl font-bold text-white">
                        Mi<span style={{ color: 'var(--color-brand)' }}>Venta</span>
                    </span>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Menu */}
            <nav className="flex-1 px-3 space-y-1">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                                ? 'text-white font-semibold'
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
            <div className="px-3 pb-6">
                <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl mb-2"
                    style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' }}>
                        {profile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'Admin'}</p>
                            <p className="text-xs text-white/40 capitalize">{profile?.role || 'admin'}</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-white/50 hover:text-white hover:bg-white/5 transition-all duration-300"
                >
                    <LogOut size={20} />
                    {!collapsed && <span className="text-sm">Sign Out</span>}
                </button>
            </div>
        </aside>
    );
}
