/**
 * Organization + Stripe Connect (Express) DTOs.
 *
 * Mirrors backend records under `code829-backend/contracts/DTOs/Organizations/` +
 * `api/Services/IStripeConnectService.cs::StripeAccountStatus`. Field shapes are
 * the source of truth on the BE side — adjust here if a BE rename lands first.
 *
 * NB: every monetary value is integer cents (`*Cents` suffix). Per the
 * frontend "no business calculations" rule, never derive a new monetary field
 * from these — request a richer DTO from the backend instead.
 */

/** Raw onboarding scope — must match BE `OnboardingLinkScope` enum casing exactly. */
export type OnboardingLinkScope = 'identity' | 'bank';

/** Coarse rendering state for status chips / banners. Computed on the BE so the
 *  FE never has to derive it. Keep in sync with BE `OrganizationStripeState`. */
export type OrganizationStripeState =
  | 'not_started'
  | 'identity_pending'
  | 'needs_bank'
  | 'active'
  | 'rejected';

/** Organization member (BusinessUser) summary — surfaces only on member-list calls.
 *  Strip PII not needed by the dev/admin UI. */
export interface OrganizationMemberSummary {
  businessUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Mirror of BE `UserRole` enum names (Developer / Admin / Staff). */
  role: string;
}

/** Listing row — returned by `GET /developer/organizations`. */
export interface OrganizationListItem {
  id: string;
  name: string;
  countryCode: string;
  /** True if a connected `acct_…` exists. Doesn't imply payouts are live. */
  hasStripeAccount: boolean;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
  stripeDetailsSubmitted: boolean;
  /** Coarse render state (see `OrganizationStripeState`). */
  stripeState: OrganizationStripeState;
  memberCount: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Detail / show — returned by `GET /developer/organizations/{id}`. */
export interface OrganizationDetail extends OrganizationListItem {
  legalName: string | null;
  stripeConnectedAccountId: string | null;
  stripeOnboardedAt: string | null;
  /** Stripe account_links `requirements.currently_due` array — strings, not formatted. */
  stripeRequirementsCurrentlyDue: string[];
  members: OrganizationMemberSummary[];
}

/** Body for `POST /developer/organizations`. */
export interface OrganizationCreateRequest {
  name: string;
  legalName?: string | null;
  /** ISO 3166-1 alpha-2 (e.g. `US`). Default `US` on the BE side if omitted. */
  countryCode: string;
  /** Initial member — required so the new org never lives orphaned. */
  initialMemberBusinessUserId: string;
}

/** Body for `PUT /developer/organizations/{id}`. */
export interface OrganizationUpdateRequest {
  name?: string;
  legalName?: string | null;
  countryCode?: string;
}

/** Body for `POST /developer/organizations/{id}/members`. */
export interface OrganizationMemberRequest {
  businessUserId: string;
}

/** Body for `POST /developer/organizations/{id}/stripe-onboarding-link` and
 *  `POST /admin/organization/stripe-resume-link`. */
export interface StripeOnboardingLinkRequest {
  scope: OnboardingLinkScope;
}

/** Stripe AccountLink response. `expiresAt` is ISO-8601 UTC; Stripe links live
 *  ~5 minutes — the UI must surface freshness, not the FE hooks. */
export interface StripeOnboardingLinkResponse {
  url: string;
  expiresAt: string;
}

/** Body for `POST /developer/organizations/{id}/stripe-onboarding-email`. */
export interface StripeOnboardingEmailRequest {
  /** BusinessUser to send the link to (must already be a member of the org). */
  businessUserId: string;
}

/** Response shape for `…/stripe-onboarding-email` — purely confirmational. */
export interface StripeOnboardingEmailResponse {
  /** ID of the email row written to `email_logs` (audit reference). */
  emailLogId: string;
  recipientEmail: string;
}

/** Mirror of BE `StripeAccountStatus` record. Returned by every status-fetch
 *  endpoint (developer + admin). All booleans come from Stripe — never derive
 *  them client-side. */
export interface StripeAccountStatus {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsCurrentlyDue: string[];
}

/** Combined status returned by `GET /developer/organizations/{id}/stripe-status`
 *  and `GET /admin/organization/stripe-status`. Wraps `StripeAccountStatus` with
 *  org-level metadata the UI needs to render the status section. */
export interface OrganizationStripeStatus {
  organizationId: string;
  organizationName: string;
  /** Null when the org has no connected account yet. */
  stripeAccount: StripeAccountStatus | null;
  /** Coarse render state (see `OrganizationStripeState`). */
  state: OrganizationStripeState;
  /** Last masked digits of the bank account — populated only when payouts active.
   *  Already masked on the BE (`**** 4242` style); never raw. */
  bankAccountLast4: string | null;
  /** Members sharing this payout account (admin settings UI surfaces this list). */
  members: OrganizationMemberSummary[];
  /** Stripe Express dashboard URL for this connected account; surfaces only when
   *  payouts are active. Pre-built on the BE — UI just renders the link. */
  expressDashboardUrl: string | null;
  /** Server timestamp of the read; UI may display "as of X" + offer a refetch. */
  fetchedAt: string;
}
