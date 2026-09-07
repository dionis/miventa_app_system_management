import axios from 'axios';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  // P0: enviar cookies httpOnly (access_token/refresh_token) en cada request
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    // Compat: Bearer si existe en localStorage (el backend acepta cookie o Bearer)
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

function shouldSkipRefresh(url = '') {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/register')
  );
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const url = originalRequest.url || '';

    if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipRefresh(url)) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (token) originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // El backend lee el refresh desde cookie httpOnly o body
        const storedRefresh = localStorage.getItem('refresh_token');
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          storedRefresh ? { refresh_token: storedRefresh } : {},
          { withCredentials: true },
        );
        if (data?.access_token) {
          localStorage.setItem('access_token', data.access_token);
          processQueue(null, data.access_token);
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return api(originalRequest);
        }
        processQueue(error, null);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
