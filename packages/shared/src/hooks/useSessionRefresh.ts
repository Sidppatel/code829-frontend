import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../lib/axios';

export function useSessionRefresh(meEndpoint = '/auth/me') {
  const setUser = useAuthStore((s) => s.setUser);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    const user = useAuthStore.getState().user;
    if (user) {
      setHydrated(true);
      const validate = async () => {
        try {
          const { data } = await apiClient.get(meEndpoint, { _skipAuthRetry: true } as never);
          if (data?.id || data?.businessUserId || data?.userId) {
            setUser(data);
          } else {
            logout();
          }
        } catch (err) {
          if (axios.isAxiosError(err)) {
            if (err.response?.status === 404 || err.response?.status === 401) {
              logout();
            }
          }
        }
      };
      void validate();
      return;
    }

    const refresh = async () => {
      try {
        const { data } = await apiClient.get(meEndpoint);
        if (data?.id || data?.businessUserId || data?.userId) {
          setUser(data);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Session refresh error', err);
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404 || err.response?.status === 401) {
            logout();
          }
        }
      } finally {
        setHydrated(true);
      }
    };
    void refresh();
  }, [meEndpoint, setHydrated, setUser, logout]);
}
