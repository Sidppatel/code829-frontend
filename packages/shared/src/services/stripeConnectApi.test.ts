import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  OrganizationStripeStatus,
  StripeOnboardingEmailResponse,
  StripeOnboardingLinkResponse,
} from '../types/organizations';

// Mock the axios client at the module-factory level so the BaseService singleton
// receives a stub `apiClient`. Reused pattern from `useSessionRefresh.test.ts`.
vi.mock('../lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import apiClient from '../lib/axios';
import { stripeConnectApi } from './stripeConnectApi';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

const linkResp: { data: StripeOnboardingLinkResponse } = {
  data: { url: 'https://stripe.test/onboarding/abc', expiresAt: '2026-04-24T12:05:00Z' },
};

const emailResp: { data: StripeOnboardingEmailResponse } = {
  data: { emailLogId: 'email-1', recipientEmail: 'admin@test.com' },
};

const statusResp: { data: OrganizationStripeStatus } = {
  data: {
    organizationId: 'org-1',
    organizationName: 'Test Org',
    stripeAccount: {
      accountId: 'acct_test_1',
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
      requirementsCurrentlyDue: [],
    },
    state: 'active',
    bankAccountLast4: '**** 4242',
    members: [],
    expressDashboardUrl: 'https://dashboard.stripe.com/connect/accounts/acct_test_1',
    fetchedAt: '2026-04-24T12:00:00Z',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('stripeConnectApi — developer surface', () => {
  describe('developerStartOnboarding', () => {
    it('POSTs to the org-scoped account endpoint with no body', async () => {
      mockPost.mockResolvedValueOnce(linkResp);
      const res = await stripeConnectApi.developerStartOnboarding('org-1');
      expect(mockPost).toHaveBeenCalledTimes(1);
      const [url, body] = mockPost.mock.calls[0];
      expect(url).toBe('/developer/organizations/org-1/stripe-account');
      expect(body).toBeUndefined();
      expect(res.data.url).toBe('https://stripe.test/onboarding/abc');
    });

    it('passes through the org id verbatim (no encoding/normalisation)', async () => {
      mockPost.mockResolvedValueOnce(linkResp);
      await stripeConnectApi.developerStartOnboarding('uuid-with-dashes-1234');
      const [url] = mockPost.mock.calls[0];
      expect(url).toBe('/developer/organizations/uuid-with-dashes-1234/stripe-account');
    });

    it('rejects when axios rejects (error shape preserved)', async () => {
      const err = Object.assign(new Error('409'), { response: { status: 409 } });
      mockPost.mockRejectedValueOnce(err);
      await expect(stripeConnectApi.developerStartOnboarding('org-1')).rejects.toBe(err);
    });
  });

  describe('developerGetOnboardingLink', () => {
    it('POSTs identity scope in the body', async () => {
      mockPost.mockResolvedValueOnce(linkResp);
      await stripeConnectApi.developerGetOnboardingLink('org-1', 'identity');
      const [url, body] = mockPost.mock.calls[0];
      expect(url).toBe('/developer/organizations/org-1/stripe-onboarding-link');
      expect(body).toEqual({ scope: 'identity' });
    });

    it('POSTs bank scope in the body (preserves narrowed enum value)', async () => {
      mockPost.mockResolvedValueOnce(linkResp);
      await stripeConnectApi.developerGetOnboardingLink('org-2', 'bank');
      const [url, body] = mockPost.mock.calls[0];
      expect(url).toBe('/developer/organizations/org-2/stripe-onboarding-link');
      expect(body).toEqual({ scope: 'bank' });
    });
  });

  describe('developerEmailOnboardingLink', () => {
    it('POSTs the businessUserId in the body', async () => {
      mockPost.mockResolvedValueOnce(emailResp);
      const res = await stripeConnectApi.developerEmailOnboardingLink('org-1', 'bu-9');
      const [url, body] = mockPost.mock.calls[0];
      expect(url).toBe('/developer/organizations/org-1/stripe-onboarding-email');
      expect(body).toEqual({ businessUserId: 'bu-9' });
      expect(res.data.recipientEmail).toBe('admin@test.com');
    });
  });

  describe('developerGetStripeStatus', () => {
    it('GETs the org-scoped status endpoint', async () => {
      mockGet.mockResolvedValueOnce(statusResp);
      const res = await stripeConnectApi.developerGetStripeStatus('org-1');
      const [url] = mockGet.mock.calls[0];
      expect(url).toBe('/developer/organizations/org-1/stripe-status');
      expect(res.data.organizationId).toBe('org-1');
      expect(res.data.state).toBe('active');
    });
  });
});

describe('stripeConnectApi — admin surface', () => {
  describe('adminGetStripeStatus', () => {
    it('GETs the JWT-scoped status endpoint with no path param', async () => {
      mockGet.mockResolvedValueOnce(statusResp);
      const res = await stripeConnectApi.adminGetStripeStatus();
      const [url] = mockGet.mock.calls[0];
      expect(url).toBe('/admin/organization/stripe-status');
      expect(res.data.state).toBe('active');
    });

    it('rejects 403 unchanged so the UI can render the no-org empty state', async () => {
      const err = Object.assign(new Error('403'), { response: { status: 403 } });
      mockGet.mockRejectedValueOnce(err);
      await expect(stripeConnectApi.adminGetStripeStatus()).rejects.toBe(err);
    });
  });

  describe('adminResumeOnboardingLink', () => {
    it('POSTs identity scope', async () => {
      mockPost.mockResolvedValueOnce(linkResp);
      await stripeConnectApi.adminResumeOnboardingLink('identity');
      const [url, body] = mockPost.mock.calls[0];
      expect(url).toBe('/admin/organization/stripe-resume-link');
      expect(body).toEqual({ scope: 'identity' });
    });

    it('POSTs bank scope', async () => {
      mockPost.mockResolvedValueOnce(linkResp);
      await stripeConnectApi.adminResumeOnboardingLink('bank');
      const [url, body] = mockPost.mock.calls[0];
      expect(url).toBe('/admin/organization/stripe-resume-link');
      expect(body).toEqual({ scope: 'bank' });
    });

    it('returns the link response unchanged', async () => {
      mockPost.mockResolvedValueOnce(linkResp);
      const res = await stripeConnectApi.adminResumeOnboardingLink('identity');
      expect(res.data.url).toBe('https://stripe.test/onboarding/abc');
      expect(res.data.expiresAt).toBe('2026-04-24T12:05:00Z');
    });
  });
});

describe('stripeConnectApi — error mapping', () => {
  it('preserves axios error shape on developer status 5xx', async () => {
    const err = Object.assign(new Error('500'), {
      response: { status: 500, data: { message: 'Stripe API timeout' } },
    });
    mockGet.mockRejectedValueOnce(err);
    await expect(stripeConnectApi.developerGetStripeStatus('org-1')).rejects.toBe(err);
  });

  it('does not swallow network errors (no response on err)', async () => {
    const networkErr = new Error('Network Error');
    mockPost.mockRejectedValueOnce(networkErr);
    await expect(stripeConnectApi.adminResumeOnboardingLink('identity')).rejects.toBe(networkErr);
  });
});
