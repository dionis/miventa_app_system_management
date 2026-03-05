import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}></div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    if (roles && profile && !roles.includes(profile.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}
