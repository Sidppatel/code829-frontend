import { useQuery, useQueryClient } from '@tanstack/react-query';
import { stripeConnectApi } from '../services/stripeConnectApi';
import { queryKeys } from '../queries/keys';
import type { OrganizationStripeStatus } from '../types/organizations';

export function useOrganizationStripeStatus(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  const enabled = Boolean(organizationId);
  const query = useQuery<OrganizationStripeStatus>({
    queryKey: queryKeys.organizations.stripeStatus(organizationId ?? ''),
    queryFn: async () => (await stripeConnectApi.developerGetStripeStatus(organizationId!)).data,
    enabled,
    staleTime: 30_000,
  });

  return {
    ...query,
    refresh: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.stripeStatus(organizationId ?? ''),
      }),
  };
}
