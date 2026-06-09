import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../lib/axios';

export function useSessionRefresh(meEndpoint = '/auth/me') {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!isHydrated) return;

    if (user) {
      const validate = async () => {
        try {
          const { data } = await apiClient.get(meEndpoint, { _skipAuthRetry: true } as never);
          if (data?.id) {
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
        if (data?.id) {
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
      }
    };
    void refresh();
  }, [meEndpoint, isHydrated, user, setUser, logout]);
}
