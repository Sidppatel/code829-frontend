import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { createLogger } from './logger';

const log = createLogger('HTTP');

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://code829-backend.onrender.com',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
  async (err) => {
    const config = err.config;
    const status = err.response?.status;
    const method = config?.method?.toUpperCase() ?? 'UNKNOWN';
    const url = config?.url ?? 'unknown';
    const message = err.response?.data?.message ?? err.message;

    // Retry on 503 (Render cold start) or network errors — only for GET and idempotent requests
    const retryCount = config?.__retryCount ?? 0;
    const isRetryable = !status || status === 503;
    const isSafeMethod = ['get', 'head', 'options'].includes(config?.method ?? '');

    if (isRetryable && isSafeMethod && retryCount < MAX_RETRIES && config) {
      config.__retryCount = retryCount + 1;
      log.warn(`Retrying ${method} ${url} (attempt ${config.__retryCount + 1}/${MAX_RETRIES + 1})`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return apiClient(config);
    }

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
