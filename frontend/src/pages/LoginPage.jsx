import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const schema = z.object({
  email: z.string().email('Invalid email').max(255),
  password: z.string().min(8, 'Min 8 characters').max(128),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (values) => {
    setError(null);
    try {
      await signIn(values.email.trim().toLowerCase(), values.password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 relative" style={{ background: 'var(--color-bg-primary)', paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10" style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))' }}></div>
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10" style={{ background: 'var(--color-brand)' }}></div>
      </div>
      <div className="absolute top-6 right-6"><ThemeToggle /></div>
      <div className="relative w-full max-w-md">
        <div className="card !p-6 md:!p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Mi<span className="gradient-text">Venta</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Sign in to the BackOffice</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Email</label>
              <input
                id="email" type="email" autoComplete="email"
                {...register('email')}
                className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200 min-h-[48px]"
                style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                placeholder="admin@miventa.com"
              />
              {errors.email && <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Password</label>
              <div className="relative">
                <input
                  id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  {...register('password')}
                  className="w-full px-4 py-3 pr-12 rounded-xl outline-none transition-all duration-200 min-h-[48px]"
                  style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  placeholder="••••••••"
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  style={{ color: 'var(--color-text-muted)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>{errors.password.message}</p>}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-sm" role="alert" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)' }}>
                <AlertCircle size={16} /> <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center text-lg py-4 disabled:opacity-50 min-h-[52px]">
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-white" role="status" aria-label="Signing in"></div>
              ) : (
                <><LogIn size={20} /> Sign In</>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <a href="/" className="text-sm transition-colors duration-300 inline-block py-2 px-4" style={{ color: 'var(--color-text-muted)' }}>← Back to homepage</a>
          </div>
        </div>
      </div>
    </div>
  );
}
