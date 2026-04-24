import { BaseService } from './BaseService';
import type {
  OnboardingLinkScope,
  OrganizationStripeStatus,
  StripeOnboardingEmailRequest,
  StripeOnboardingEmailResponse,
  StripeOnboardingLinkRequest,
  StripeOnboardingLinkResponse,
} from '../types/organizations';

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
  developerStartOnboarding = (organizationId: string) =>
    this.post<StripeOnboardingLinkResponse>(
      `/developer/organizations/${organizationId}/stripe-account`,
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
  developerGetStripeStatus = (organizationId: string) =>
    this.get<OrganizationStripeStatus>(
      `/developer/organizations/${organizationId}/stripe-status`,
    );

  // ── Admin surface ──────────────────────────────────────────────────────────

  /**
   * Reads the authenticated admin's own organization Stripe status. No path
   * param — BE looks up `BusinessUser.OrganizationId` from the JWT subject.
   * 403 when the admin has no Organization (UI should render the "contact
   * platform" empty state).
   */
  adminGetStripeStatus = () =>
    this.get<OrganizationStripeStatus>('/admin/organization/stripe-status');

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
