import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../lib/axios';

export function useSessionRefresh(meEndpoint = '/auth/me') {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    if (user) {
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
        // No valid session - user needs to log in
      } finally {
        setHydrated(true);
      }
    };
    void refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
