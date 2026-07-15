import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const { data } = await api.get('/auth/me');
                    // data is the full profile combined with token validation
                    setUser({ id: data.id, email: data.email, role: data.role });
                    setProfile(data);
                } catch (error) {
                    console.error('Session validation failed:', error);
                    localStorage.removeItem('access_token');
                    setUser(null);
                    setProfile(null);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const signIn = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('access_token', data.access_token);

        // data.user contains the full profile returned from login
        setUser({ id: data.user.id, email: data.user.email, role: data.user.role });
        setProfile(data.user);

        return data;
    };

    const signOut = () => {
        localStorage.removeItem('access_token');
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
