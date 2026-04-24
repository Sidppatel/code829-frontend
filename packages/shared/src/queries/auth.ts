import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/authApi';
import { useAuthStore } from '../stores/authStore';
import { queryKeys } from './keys';

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => (await authApi.getMe()).data,
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      useAuthStore.getState().logout();
    },
    onSuccess: () => queryClient.clear(),
  });
}
