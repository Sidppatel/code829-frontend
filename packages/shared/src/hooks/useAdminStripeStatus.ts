import { useQuery, useQueryClient } from '@tanstack/react-query';
import { stripeConnectApi } from '../services/stripeConnectApi';
import { queryKeys } from '../queries/keys';
import type { OrganizationStripeStatus } from '../types/organizations';

/**
 * Stripe status of the authenticated admin's own organization. No id param —
 * the BE looks up `BusinessUser.OrganizationId` from the JWT subject.
 *
 * Used by the admin Settings page Payouts section. Refetches on mount so admins
 * landing on `/settings/stripe/return?status=complete` always see the latest
 * post-onboarding state.
 *
 * BE returns 403 with no body when the admin has no Organization yet — caller
 * should render the "contact platform developer" empty state from `error`.
 */
export function useAdminStripeStatus() {
  const queryClient = useQueryClient();
  const query = useQuery<OrganizationStripeStatus>({
    queryKey: queryKeys.adminStripe.status(),
    queryFn: async () => (await stripeConnectApi.adminGetStripeStatus()).data,
    // Admin settings is a low-traffic page; refetch on every mount so a returning
    // admin sees the live status straight away.
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return {
    ...query,
    /** Force-refresh the status (called after `/settings/stripe/return` lands or
     *  the admin clicks a manual "Refresh" button). */
    refresh: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStripe.status() }),
  };
}
