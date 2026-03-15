import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ThemeToggle from '../ThemeToggle';
import { Menu } from 'lucide-react';

export default function AdminLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="flex min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
            <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
            <main className="flex-1 overflow-auto w-full">
                <div className="max-w-[1600px] mx-auto w-full">
                    {/* Top bar */}
                    <div className="sticky top-0 z-10 flex items-center justify-between md:justify-end px-4 md:px-10 py-5 glass decoration-none border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <button
                            className="md:hidden p-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => setMobileOpen(true)}
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            <Menu size={24} />
                        </button>
                        <ThemeToggle />
                    </div>
                    {/* Content */}
                    <div className="p-6 md:p-12 lg:p-16">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
