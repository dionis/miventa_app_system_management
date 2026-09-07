import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import ThemeToggle from '../ThemeToggle';
import { Menu, ChevronRight } from 'lucide-react';

const CRUMBS = {
  '/admin/dashboard': 'sidebar.dashboard',
  '/admin/referrals': 'sidebar.referrals',
  '/admin/users': 'sidebar.users',
  '/admin/faqs': 'sidebar.faqs',
  '/admin/logs': 'sidebar.logs',
};

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  const crumbKey = CRUMBS[location.pathname];

  // Cerrar drawer al cambiar de ruta (seguridad extra para mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[100dvh] overflow-x-hidden" style={{ background: 'var(--color-bg-primary)' }}>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-[1600px] mx-auto w-full">
          {/* Top bar */}
          <div
            className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 md:px-10 py-3 md:py-5 glass border-b"
            style={{ borderColor: 'var(--color-border)', paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <button
                className="md:hidden flex p-3 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 items-center justify-center min-w-[44px] min-h-[44px]"
                onClick={() => setMobileOpen(true)}
                style={{ color: 'var(--color-text-primary)' }}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
              >
                <Menu size={24} />
              </button>
              {/* Breadcrumb: ayuda a orientarse en mobile */}
              <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 text-sm min-w-0" style={{ color: 'var(--color-text-muted)' }}>
                <Link to="/admin/dashboard" className="hover:underline shrink-0">Admin</Link>
                {crumbKey && (
                  <>
                    <ChevronRight size={14} aria-hidden="true" className="shrink-0" />
                    <span className="truncate font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t(crumbKey)}</span>
                  </>
                )}
              </nav>
            </div>
            <ThemeToggle className="min-w-[44px] min-h-[44px] flex items-center justify-center" />
          </div>
          {/* Content: padding compacto en mobile, amplio en desktop */}
          <div className="p-4 md:p-8 lg:p-10">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
