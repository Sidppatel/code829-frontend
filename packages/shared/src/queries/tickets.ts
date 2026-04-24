import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../services/ticketsApi';
import { queryKeys } from './keys';

export function useGuestTicketsQuery() {
  return useQuery({
    queryKey: queryKeys.tickets.mine(),
    queryFn: async () => (await ticketsApi.getMine()).data,
  });
}

export function useTicketClaimInfoQuery(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tickets.claimInfo(token ?? ''),
    queryFn: async () => (await ticketsApi.getClaimInfo(token!)).data,
    enabled: !!token,
  });
}

export function useClaimTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => (await ticketsApi.claim(token)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all }),
  });
}
