
export type OnboardingLinkScope = 'identity' | 'bank';

export type OrganizationStripeState =
  | 'not_started'
  | 'identity_pending'
  | 'needs_bank'
  | 'active'
  | 'rejected';

export interface OrganizationMemberSummary {
  businessUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface OrganizationListItem {
  id: string;
  name: string;
  countryCode: string;
  hasStripeAccount: boolean;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
  stripeDetailsSubmitted: boolean;
  stripeState: OrganizationStripeState;
  memberCount: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationDetail extends OrganizationListItem {
  legalName: string | null;
  stripeConnectedAccountId: string | null;
  stripeOnboardedAt: string | null;
  stripeRequirementsCurrentlyDue: string[];
  members: OrganizationMemberSummary[];
}

export interface OrganizationCreateRequest {
  name: string;
  legalName?: string | null;
  countryCode: string;
  initialMemberBusinessUserId: string;
}

export interface OrganizationUpdateRequest {
  name?: string;
  legalName?: string | null;
  countryCode?: string;
}

export interface OrganizationMemberRequest {
  businessUserId: string;
}

export interface StripeOnboardingLinkRequest {
  scope: OnboardingLinkScope;
}

export interface StartStripeOnboardingRequest {
  businessType: 'individual' | 'company';
  legalName?: string;
  productDescription?: string;
  mcc?: string;
}

export interface StripeOnboardingLinkResponse {
  url: string;
  expiresAt: string;
}

export interface StripeOnboardingEmailRequest {
  businessUserId?: string;
  recipientEmail?: string;
}

export interface StripeOnboardingEmailResponse {
  emailLogId: string;
  recipientEmail: string;
}

export interface StripeAccountStatus {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsCurrentlyDue: string[];
}

export interface OrganizationStripeStatus {
  organizationId: string;
  organizationName: string;
  stripeAccount: StripeAccountStatus | null;
  state: OrganizationStripeState;
  bankAccountLast4: string | null;
  members: OrganizationMemberSummary[];
  expressDashboardUrl: string | null;
  fetchedAt: string;
}
