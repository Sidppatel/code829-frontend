import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { createLogger } from './logger';

const log = createLogger('HTTP');

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // CSRF token
  const xsrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
  if (xsrfToken) config.headers['X-XSRF-TOKEN'] = xsrfToken;

  return config;
});

apiClient.interceptors.response.use(
  (res) => {
    // Log slow requests as warnings
    const duration = res.headers['x-response-time'];
    if (duration && parseInt(duration, 10) > 2000) {
      log.warn(`Slow response: ${res.config.method?.toUpperCase()} ${res.config.url} (${duration}ms)`);
    }
    return res;
  },
  (err) => {
    const status = err.response?.status;
    const method = err.config?.method?.toUpperCase() ?? 'UNKNOWN';
    const url = err.config?.url ?? 'unknown';
    const message = err.response?.data?.message ?? err.message;

    if (status === 401) {
      log.warn(`Auth expired: ${method} ${url}`);
      useAuthStore.getState().logout();
    } else if (status && status >= 500) {
      log.error(`Server error ${status}: ${method} ${url} — ${message}`, err.response?.data);
    } else if (status && status >= 400) {
      log.warn(`Client error ${status}: ${method} ${url} — ${message}`);
    } else {
      log.error(`Network error: ${method} ${url} — ${err.message}`);
    }

    return Promise.reject(err);
  },
);

export default apiClient;
