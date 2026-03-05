import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
    async (config) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle global errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // Token expired — sign out
                    supabase.auth.signOut();
                    window.location.href = '/login';
                    break;
                case 403:
                    console.error('Access denied');
                    break;
                case 500:
                    console.error('Server error');
                    break;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
