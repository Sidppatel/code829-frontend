import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { createLogger } from './logger';

const log = createLogger('HTTP');

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

// Determine base URL dynamically to handle Cloudflare proxying and CORS
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  
  // Force proxy for Cloudflare Pages or if specifically requested via env
  if (hostname.endsWith('pages.dev') || envUrl === '/api') {
    return '/api';
  }
  
  return envUrl || '/api';
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  // Ensure relative URLs don't bypass the /api proxy
  // If baseline is '/api' and url is '/events', make it 'events' so it becomes '/api/events'
  if (config.baseURL === '/api' && config.url?.startsWith('/')) {
    config.url = config.url.substring(1);
  }
  
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

    if (status === 401 && !config?._skipAuthRetry) {
      // Session cookie might still be valid — try one silent refresh
      try {
        const meUrl = config?.url?.startsWith('/admin') ? '/admin/auth/me' : '/auth/me';
        const res = await apiClient.get(meUrl, { _skipAuthRetry: true } as any);
        if (res.data?.id) {
          useAuthStore.getState().setUser(res.data);
          // Retry original request
          if (config) {
            config._skipAuthRetry = true;
            return apiClient(config);
          }
        }
      } catch {
        log.warn(`Session expired: ${method} ${url}`);
        useAuthStore.getState().logout();
      }
    } else if (status === 401) {
      // Already retried — do not loop
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
