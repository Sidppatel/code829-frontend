import type { AxiosResponse } from 'axios';
import { BaseService } from './BaseService';
import type {
  OnboardingLinkScope,
  OrganizationStripeState,
  OrganizationStripeStatus,
  StartStripeOnboardingRequest,
  StripeOnboardingEmailRequest,
  StripeOnboardingEmailResponse,
  StripeOnboardingLinkRequest,
  StripeOnboardingLinkResponse,
} from '../types/organizations';

// BE currently returns a flat shape from /admin/organization/stripe-status and
// /developer/organizations/{id}/stripe-status — no `state`, `members`,
// `bankAccountLast4`, `expressDashboardUrl`, `fetchedAt`. Until the BE
// contract is widened, normalize on the FE so consumers get the typed shape.
type RawStripeStatus = Partial<OrganizationStripeStatus> & {
  organizationId?: string;
  organizationName?: string;
  stripeAccountId?: string | null;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  requirementsCurrentlyDue?: string[];
};

function deriveStripeState(raw: RawStripeStatus): OrganizationStripeState {
  if (raw.state) return raw.state;
  if (!raw.stripeAccountId && !raw.stripeAccount) return 'not_started';
  if (!raw.detailsSubmitted) return 'identity_pending';
  if (!raw.payoutsEnabled) return 'needs_bank';
  if (raw.chargesEnabled && raw.payoutsEnabled) return 'active';
  return 'identity_pending';
}

function normalizeStripeStatus(raw: RawStripeStatus): OrganizationStripeStatus {
  const stripeAccount = raw.stripeAccount
    ?? (raw.stripeAccountId
      ? {
          accountId: raw.stripeAccountId,
          chargesEnabled: !!raw.chargesEnabled,
          payoutsEnabled: !!raw.payoutsEnabled,
          detailsSubmitted: !!raw.detailsSubmitted,
          requirementsCurrentlyDue: raw.requirementsCurrentlyDue ?? [],
        }
      : null);

  return {
    organizationId: raw.organizationId ?? '',
    organizationName: raw.organizationName ?? '',
    stripeAccount,
    state: deriveStripeState(raw),
    bankAccountLast4: raw.bankAccountLast4 ?? null,
    members: raw.members ?? [],
    expressDashboardUrl: raw.expressDashboardUrl ?? null,
    fetchedAt: raw.fetchedAt ?? new Date().toISOString(),
  };
}

/**
 * Stripe Connect (Express) onboarding + status client.
 *
 * Two surfaces:
 *
 * - Developer-prefixed methods hit `/developer/organizations/{id}/stripe-…` and
 *   are scoped by URL path. Caller must be authenticated via the developer portal
 *   session cookie.
 * - Admin-prefixed methods hit `/admin/organization/stripe-…` (singular —
 *   the admin user is implicitly bound to the organization their BusinessUser
 *   belongs to via JWT). Caller must be authenticated via the admin portal
 *   session cookie.
 *
 * The X-Portal header is wired automatically by `configureApiClient` (see
 * `lib/axios.ts`); each app wires it once at boot.
 */
export class StripeConnectService extends BaseService {
  private static _instance: StripeConnectService | null = null;
  static getInstance(): StripeConnectService {
    return (this._instance ??= new StripeConnectService());
  }
  private constructor() {
    super('StripeConnectService');
  }

  // ── Developer surface ──────────────────────────────────────────────────────

  /**
   * Creates a Stripe Express connected account for the organization (idempotent —
   * re-calling on an org that already has `acct_…` returns the same account ID
   * plus a fresh identity-scope onboarding link). Returns the initial onboarding
   * link in the same response so the developer UI can show it without a second
   * round-trip.
   */
  developerStartOnboarding = (
    organizationId: string,
    request: StartStripeOnboardingRequest,
  ) =>
    this.post<StripeOnboardingLinkResponse>(
      `/developer/organizations/${organizationId}/stripe-account`,
      request,
    );

  /**
   * Generates a fresh onboarding link for the org. Stripe links are ephemeral
   * (~5 min TTL); always request a new one when the user is about to act, never
   * cache.
   */
  developerGetOnboardingLink = (organizationId: string, scope: OnboardingLinkScope) => {
    const body: StripeOnboardingLinkRequest = { scope };
    return this.post<StripeOnboardingLinkResponse>(
      `/developer/organizations/${organizationId}/stripe-onboarding-link`,
      body,
    );
  };

  /**
   * Sends an onboarding link to a specific member's email via Resend. BE owns
   * the templating; the FE supplies only the BusinessUser to deliver to.
   */
  developerEmailOnboardingLink = (organizationId: string, businessUserId: string) => {
    const body: StripeOnboardingEmailRequest = { businessUserId };
    return this.post<StripeOnboardingEmailResponse>(
      `/developer/organizations/${organizationId}/stripe-onboarding-email`,
      body,
    );
  };

  /**
   * Reads org-scoped Stripe status. BE refreshes from Stripe + persists when the
   * row is older than its freshness window — callers don't need to do that here.
   */
  developerGetStripeStatus = async (
    organizationId: string,
  ): Promise<AxiosResponse<OrganizationStripeStatus>> => {
    const res = await this.get<RawStripeStatus>(
      `/developer/organizations/${organizationId}/stripe-status`,
    );
    return { ...res, data: normalizeStripeStatus(res.data) };
  };

  // ── Admin surface ──────────────────────────────────────────────────────────

  /**
   * Reads the authenticated admin's own organization Stripe status. No path
   * param — BE looks up `BusinessUser.OrganizationId` from the JWT subject.
   * 403 when the admin has no Organization (UI should render the "contact
   * platform" empty state).
   */
  adminGetStripeStatus = async (): Promise<AxiosResponse<OrganizationStripeStatus>> => {
    const res = await this.get<RawStripeStatus>('/admin/organization/stripe-status');
    return { ...res, data: normalizeStripeStatus(res.data) };
  };

  /**
   * Mints a fresh onboarding link for the authenticated admin's org. Any admin
   * in the org can resume — they share the underlying Stripe account.
   */
  adminResumeOnboardingLink = (scope: OnboardingLinkScope) => {
    const body: StripeOnboardingLinkRequest = { scope };
    return this.post<StripeOnboardingLinkResponse>(
      '/admin/organization/stripe-resume-link',
      body,
    );
  };
}

export const stripeConnectService = StripeConnectService.getInstance();

/** Functional re-export to match the per-portal `*Api` convention used by the
 *  rest of the package. */
export const stripeConnectApi = {
  developerStartOnboarding: stripeConnectService.developerStartOnboarding,
  developerGetOnboardingLink: stripeConnectService.developerGetOnboardingLink,
  developerEmailOnboardingLink: stripeConnectService.developerEmailOnboardingLink,
  developerGetStripeStatus: stripeConnectService.developerGetStripeStatus,
  adminGetStripeStatus: stripeConnectService.adminGetStripeStatus,
  adminResumeOnboardingLink: stripeConnectService.adminResumeOnboardingLink,
};
