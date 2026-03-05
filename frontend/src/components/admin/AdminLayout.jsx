import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ThemeToggle from '../ThemeToggle';

export default function AdminLayout() {
    return (
        <div className="flex min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
            <Sidebar />
            <main className="flex-1 overflow-auto">
                {/* Top bar */}
                <div className="sticky top-0 z-10 flex items-center justify-end px-8 py-4 glass">
                    <ThemeToggle />
                </div>
                {/* Content */}
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
