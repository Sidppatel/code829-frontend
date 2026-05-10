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

export class StripeConnectService extends BaseService {
  private static _instance: StripeConnectService | null = null;
  static getInstance(): StripeConnectService {
    return (this._instance ??= new StripeConnectService());
  }
  private constructor() {
    super('StripeConnectService');
  }

  developerStartOnboarding = (
    organizationId: string,
    request: StartStripeOnboardingRequest,
  ) =>
    this.post<StripeOnboardingLinkResponse>(
      `/developer/organizations/${organizationId}/stripe-account`,
      request,
    );

  developerGetOnboardingLink = (organizationId: string, scope: OnboardingLinkScope) => {
    const body: StripeOnboardingLinkRequest = { scope };
    return this.post<StripeOnboardingLinkResponse>(
      `/developer/organizations/${organizationId}/stripe-onboarding-link`,
      body,
    );
  };

  developerEmailOnboardingLink = (
    organizationId: string,
    target: { businessUserId?: string; recipientEmail?: string },
  ) => {
    const body: StripeOnboardingEmailRequest = {};
    if (target.businessUserId) body.businessUserId = target.businessUserId;
    if (target.recipientEmail) body.recipientEmail = target.recipientEmail;
    return this.post<StripeOnboardingEmailResponse>(
      `/developer/organizations/${organizationId}/stripe-onboarding-email`,
      body,
    );
  };

  developerGetStripeStatus = async (
    organizationId: string,
  ): Promise<AxiosResponse<OrganizationStripeStatus>> => {
    const res = await this.get<RawStripeStatus>(
      `/developer/organizations/${organizationId}/stripe-status`,
    );
    return { ...res, data: normalizeStripeStatus(res.data) };
  };

  adminGetStripeStatus = async (): Promise<AxiosResponse<OrganizationStripeStatus>> => {
    const res = await this.get<RawStripeStatus>('/admin/organization/stripe-status');
    return { ...res, data: normalizeStripeStatus(res.data) };
  };

  adminResumeOnboardingLink = (scope: OnboardingLinkScope) => {
    const body: StripeOnboardingLinkRequest = { scope };
    return this.post<StripeOnboardingLinkResponse>(
      '/admin/organization/stripe-resume-link',
      body,
    );
  };
}

export const stripeConnectService = StripeConnectService.getInstance();

export const stripeConnectApi = {
  developerStartOnboarding: stripeConnectService.developerStartOnboarding,
  developerGetOnboardingLink: stripeConnectService.developerGetOnboardingLink,
  developerEmailOnboardingLink: stripeConnectService.developerEmailOnboardingLink,
  developerGetStripeStatus: stripeConnectService.developerGetStripeStatus,
  adminGetStripeStatus: stripeConnectService.adminGetStripeStatus,
  adminResumeOnboardingLink: stripeConnectService.adminResumeOnboardingLink,
};
