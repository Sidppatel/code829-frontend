import { useQuery, useQueryClient } from '@tanstack/react-query';
import { stripeConnectApi } from '../services/stripeConnectApi';
import { queryKeys } from '../queries/keys';
import type { OrganizationStripeStatus } from '../types/organizations';

export function useAdminStripeStatus() {
  const queryClient = useQueryClient();
  const query = useQuery<OrganizationStripeStatus>({
    queryKey: queryKeys.adminStripe.status(),
    queryFn: async () => (await stripeConnectApi.adminGetStripeStatus()).data,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return {
    ...query,
    refresh: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStripe.status() }),
  };
}
