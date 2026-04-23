import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../lib/axios';

/**
 * On mount, validates the session cookie against the backend and hydrates the store.
 *
 * If user was persisted in localStorage (from a previous session), the UI is
 * unblocked immediately — isHydrated is set to true right away so ProtectedRoute
 * doesn't flash the login page. A background probe to /auth/me then validates the
 * session cookie; if it returns 401 the axios interceptor calls logout() and the
 * persisted store is cleared, redirecting the user to login.
 *
 * If there is no cached user, the probe runs first and isHydrated flips only after
 * it completes, preserving the original loading-spinner behaviour.
 */
export function useSessionRefresh(meEndpoint = '/auth/me') {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    if (user) {
      // Restore from cache immediately — no loading spinner for returning users.
      // Then validate in the background; the 401 interceptor handles session expiry.
      setHydrated(true);
      const validate = async () => {
        try {
          const { data } = await apiClient.get(meEndpoint, { _skipAuthRetry: true } as never);
          if (data?.id) setUser(data);
        } catch {
          // 401 → axios interceptor already called logout() and cleared the store
        }
      };
      void validate();
      return;
    }

    const refresh = async () => {
      try {
        const { data } = await apiClient.get(meEndpoint);
        if (data?.id) setUser(data);
      } catch {
        // No valid session — user needs to log in
      } finally {
        setHydrated(true);
      }
    };
    void refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
