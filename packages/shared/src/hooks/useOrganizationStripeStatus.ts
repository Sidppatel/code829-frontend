import { useQuery, useQueryClient } from '@tanstack/react-query';
import { stripeConnectApi } from '../services/stripeConnectApi';
import { queryKeys } from '../queries/keys';
import type { OrganizationStripeStatus } from '../types/organizations';

/**
 * Stripe status of an organization (developer-side view). Caller passes the
 * org id from a row click / route param.
 *
 * The query is `enabled` only when an id is supplied so a placeholder render
 * (e.g. before the developer picks an org) doesn't fire a wasted fetch. Stripe
 * status is server-driven — UI never derives it from raw flags.
 *
 * Refetch policy:
 * - 30s `staleTime` to avoid hammering Stripe on every focus
 * - explicit `refetch()` exposed for UI "Refresh status" buttons
 * - the BE returns `fetchedAt` so a stale-banner can be rendered if needed
 */
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
    /** Force-refresh the status (used by manual refresh buttons + after the user
     *  returns from the Stripe-hosted onboarding flow). */
    refresh: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.stripeStatus(organizationId ?? ''),
      }),
  };
}
