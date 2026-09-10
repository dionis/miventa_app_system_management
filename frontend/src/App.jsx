import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages (públicas, eager: LCP)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

// Admin Pages (lazy: reduce bundle inicial ~781KB -> split por ruta, clave en mobile)
import AdminLayout from './components/admin/AdminLayout';
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Plans = lazy(() => import('./pages/admin/Plans'));
const Referrals = lazy(() => import('./pages/admin/Referrals'));
const Users = lazy(() => import('./pages/admin/Users'));
const FAQManager = lazy(() => import('./pages/admin/FAQManager'));
const EventLog = lazy(() => import('./pages/admin/EventLog'));

function RouteLoader() {
  return (
    <div className="flex items-center justify-center py-20" role="status" aria-label="Loading page">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}></div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin', 'staff', 'customer']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Suspense fallback={<RouteLoader />}><Dashboard /></Suspense>} />
            <Route
              path="plans"
              element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <Suspense fallback={<RouteLoader />}><Plans /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route path="referrals" element={<Suspense fallback={<RouteLoader />}><Referrals /></Suspense>} />
            <Route
              path="users"
              element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <Suspense fallback={<RouteLoader />}><Users /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="faqs"
              element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <Suspense fallback={<RouteLoader />}><FAQManager /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="logs"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Suspense fallback={<RouteLoader />}><EventLog /></Suspense>
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
