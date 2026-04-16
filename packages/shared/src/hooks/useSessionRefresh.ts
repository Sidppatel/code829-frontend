import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../lib/axios';

/**
 * On mount, if no JWT is in memory but the session cookie might still be valid,
 * attempt to restore the session by calling /auth/me.
 * DeviceSessionMiddleware will authenticate via the cookie and return the user.
 */
export function useSessionRefresh(meEndpoint = '/auth/me') {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (token) return; // Already have a token in memory

    const refresh = async () => {
      try {
        const { data } = await apiClient.get(meEndpoint);
        if (data?.id) {
          // Session cookie was valid — restore auth state
          // We don't get a JWT back, but the session cookie will authenticate future requests
          setAuth('session-cookie', data);
        }
      } catch {
        // No valid session — user needs to log in
      }
    };
    void refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
