import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { createLogger } from './logger';

const log = createLogger('HTTP');

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

// Determine base URL dynamically to handle Cloudflare proxying and CORS.
// In production (any non-localhost host) the Cloudflare Worker proxies /api/* to the
// backend, so always use the relative /api path — never the raw backend URL, which
// the CSP connect-src would block and which bypasses the Worker's auth/CORS handling.
const getBaseURL = () => {
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  if (isLocal) {
    // Dev: Vite proxy forwards /api → backend, or use VITE_API_URL directly if set
    return import.meta.env.VITE_API_URL || '/api';
  }
  // Production (Cloudflare Workers): always route through the /api Worker proxy
  return '/api';
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  // Session cookies are HttpOnly and per-portal (session_user / session_admin / …). They
  // need to ride along on every request so DeviceSessionMiddleware can rehydrate the
  // session on refresh. Vite dev proxy forwards them fine once this flag is on.
  withCredentials: true,
});

/**
 * Portal identifier attached to every outgoing request as the X-Portal header. The backend
 * uses it to pick the matching cookie (session_user / session_admin / session_staff /
 * session_developer), so two portals open in the same browser never clobber each other's
 * session. Each app calls {@link configureApiClient} once at boot.
 */
export type PortalId = 'user' | 'admin' | 'staff' | 'developer';

let portalId: PortalId | null = null;
export function configureApiClient(portal: PortalId) {
  portalId = portal;
  apiClient.defaults.headers.common['X-Portal'] = portal;
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (portalId) config.headers['X-Portal'] = portalId;

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
