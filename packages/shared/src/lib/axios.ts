import axios, { type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { createLogger } from './logger';

const log = createLogger('HTTP');

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

const getBaseURL = () => {
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  if (isLocal) {
    return import.meta.env.VITE_API_URL || '/api/v1';
  }
  return '/api/v1';
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true,
});

export type PortalId = 'user' | 'admin' | 'staff' | 'developer';

let portalId: PortalId | null = null;
export function configureApiClient(portal: PortalId) {
  portalId = portal;
  apiClient.defaults.headers.common['X-Portal'] = portal;
}

apiClient.interceptors.request.use((config) => {
  if (portalId) config.headers['X-Portal'] = portalId;

  if (config.baseURL === '/api/v1' && config.url?.startsWith('/')) {
    config.url = config.url.substring(1);
  }

  return config;
});

apiClient.interceptors.response.use(
  (res) => {
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
      try {
        const meUrl = config?.url?.startsWith('/admin') ? '/admin/auth/me' : '/auth/me';
        const res = await apiClient.get(meUrl, { _skipAuthRetry: true } as AxiosRequestConfig);
        if (res.data?.id) {
          useAuthStore.getState().setUser(res.data);
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
