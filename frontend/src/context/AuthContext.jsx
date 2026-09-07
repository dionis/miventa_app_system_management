import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // P0: intentar sesión por cookie httpOnly aunque no haya token en localStorage
      try {
        const { data } = await api.get('/auth/me');
        setUser({ id: data.id, email: data.email, role: data.role });
        setProfile(data);
      } catch (error) {
        // Sin sesión válida: limpiar restos locales (no es error fatal)
        if (error?.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        } else {
          console.error('Session validation failed:', error);
        }
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    // Backend además setea cookies httpOnly; guardamos access en localStorage
    // solo por compatibilidad con el interceptor Bearer.
    if (data?.access_token) localStorage.setItem('access_token', data.access_token);
    if (data?.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);

    setUser({ id: data.user.id, email: data.user.email, role: data.user.role });
    setProfile(data.user);

    return data;
  };

  const signOut = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // ignorar: igual limpiamos local
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
