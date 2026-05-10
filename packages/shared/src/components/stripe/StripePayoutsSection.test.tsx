import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StripePayoutsSection from './StripePayoutsSection';
import type {
  OrganizationStripeStatus,
  OrganizationStripeState,
} from '../../types/organizations';

vi.mock('../../hooks/useAdminStripeStatus', () => ({
  useAdminStripeStatus: vi.fn(),
}));

vi.mock('../../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

vi.mock('../../services/stripeConnectApi', () => ({
  stripeConnectApi: {
    adminResumeOnboardingLink: vi.fn(),
  },
}));

import { useAdminStripeStatus } from '../../hooks/useAdminStripeStatus';
import { useIsMobile } from '../../hooks/useIsMobile';
import { stripeConnectApi } from '../../services/stripeConnectApi';

type HookReturn = ReturnType<typeof useAdminStripeStatus>;

const mockUseAdminStripeStatus = vi.mocked(useAdminStripeStatus);
const mockUseIsMobile = vi.mocked(useIsMobile);
const mockResume = vi.mocked(stripeConnectApi.adminResumeOnboardingLink);

const baseStatus = (overrides: Partial<OrganizationStripeStatus>): OrganizationStripeStatus => ({
  organizationId: 'org-1',
  organizationName: 'Acme Productions',
  stripeAccount: null,
  state: 'not_started',
  bankAccountLast4: null,
  members: [],
  expressDashboardUrl: null,
  fetchedAt: '2026-04-24T12:00:00Z',
  ...overrides,
});

function buildHookReturn(state: OrganizationStripeState | 'loading' | 'error' | 'no-org', extra: Partial<OrganizationStripeStatus> = {}): HookReturn {
  const refresh = vi.fn().mockResolvedValue(undefined);
  if (state === 'loading') {
    return { data: undefined, isLoading: true, isFetching: true, isError: false, error: null, refresh } as unknown as HookReturn;
  }
  if (state === 'no-org') {
    const err = Object.assign(new Error('403'), { response: { status: 403 } });
    return { data: undefined, isLoading: false, isFetching: false, isError: true, error: err, refresh } as unknown as HookReturn;
  }
  if (state === 'error') {
    const err = Object.assign(new Error('500'), { response: { status: 500 } });
    return { data: undefined, isLoading: false, isFetching: false, isError: true, error: err, refresh } as unknown as HookReturn;
  }
  return {
    data: baseStatus({ state, ...extra }),
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refresh,
  } as unknown as HookReturn;
}

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <App>{ui}</App>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseIsMobile.mockReturnValue(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('StripePayoutsSection — state matrix', () => {
  it('shows loading state', () => {
    mockUseAdminStripeStatus.mockReturnValue(buildHookReturn('loading'));
    renderWithProviders(<StripePayoutsSection />);
    expect(screen.getByRole('status', { name: /loading payout status/i })).toBeInTheDocument();
  });

  it('shows the no-org empty state with a mailto link on 403', () => {
    mockUseAdminStripeStatus.mockReturnValue(buildHookReturn('no-org'));
    renderWithProviders(<StripePayoutsSection />);
    expect(screen.getByText(/payouts not yet enabled/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /email the platform team/i });
    expect(link.getAttribute('href')).toContain('mailto:');
  });

  it('shows the error state with a retry button on 5xx', async () => {
    const ret = buildHookReturn('error');
    mockUseAdminStripeStatus.mockReturnValue(ret);
    renderWithProviders(<StripePayoutsSection />);
    const retryBtn = screen.getByRole('button', { name: /try again/i });
    expect(retryBtn).toBeInTheDocument();
    await userEvent.click(retryBtn);
    expect(ret.refresh).toHaveBeenCalled();
  });

  it('renders identity-pending — Resume onboarding button visible', () => {
    mockUseAdminStripeStatus.mockReturnValue(buildHookReturn('identity_pending'));
    renderWithProviders(<StripePayoutsSection />);
    expect(screen.getByText(/identity pending/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resume onboarding/i })).toBeInTheDocument();
  });

  it('renders bank-needed — Add bank account button visible', () => {
    mockUseAdminStripeStatus.mockReturnValue(buildHookReturn('needs_bank'));
    renderWithProviders(<StripePayoutsSection />);
    expect(screen.getByText(/bank account required/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add bank account/i })).toBeInTheDocument();
  });

  it('renders active state with masked bank last 4 + dashboard link', () => {
    mockUseAdminStripeStatus.mockReturnValue(
      buildHookReturn('active', {
        bankAccountLast4: '**** 4242',
        expressDashboardUrl: 'https://dashboard.stripe.com/connect/accounts/acct_test',
        stripeAccount: {
          accountId: 'acct_test',
          chargesEnabled: true,
          payoutsEnabled: true,
          detailsSubmitted: true,
          requirementsCurrentlyDue: [],
        },
      }),
    );
    renderWithProviders(<StripePayoutsSection />);
    expect(screen.getByText(/payouts active/i)).toBeInTheDocument();
    expect(screen.getByText('**** 4242')).toBeInTheDocument();
    const dash = screen.getByRole('link', { name: /open stripe express dashboard/i });
    expect(dash.getAttribute('href')).toBe(
      'https://dashboard.stripe.com/connect/accounts/acct_test',
    );
    expect(dash.getAttribute('target')).toBe('_blank');
    expect(dash.getAttribute('rel')).toContain('noopener');
  });

  it('renders rejected state with Contact support button (danger styling)', () => {
    mockUseAdminStripeStatus.mockReturnValue(buildHookReturn('rejected'));
    renderWithProviders(<StripePayoutsSection />);
    expect(screen.getByText(/account rejected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /contact support/i })).toBeInTheDocument();
  });

  it('renders the members-sharing list when members are present', () => {
    mockUseAdminStripeStatus.mockReturnValue(
      buildHookReturn('active', {
        members: [
          { businessUserId: 'bu-1', firstName: 'Alice', lastName: 'Adams', email: 'alice@x.com', role: 'Admin' },
          { businessUserId: 'bu-2', firstName: 'Bob', lastName: 'Brown', email: 'bob@x.com', role: 'Admin' },
        ],
        bankAccountLast4: '**** 1111',
        expressDashboardUrl: 'https://dashboard.stripe.com/connect/accounts/acct_test',
        stripeAccount: {
          accountId: 'acct_test',
          chargesEnabled: true,
          payoutsEnabled: true,
          detailsSubmitted: true,
          requirementsCurrentlyDue: [],
        },
      }),
    );
    renderWithProviders(<StripePayoutsSection />);
    expect(screen.getByText(/members sharing this payout account/i)).toBeInTheDocument();
    expect(screen.getByText('Alice Adams')).toBeInTheDocument();
    expect(screen.getByText('Bob Brown')).toBeInTheDocument();
    expect(screen.getByText('AA')).toBeInTheDocument();
    expect(screen.getByText('BB')).toBeInTheDocument();
  });
});

describe('StripePayoutsSection — onResume integration', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: '' } as Location,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it('clicking Resume onboarding mints a fresh link and redirects', async () => {
    mockResume.mockResolvedValueOnce({
      data: { url: 'https://stripe.test/onboarding/abc', expiresAt: '2026-04-24T12:05:00Z' },
    } as Awaited<ReturnType<typeof stripeConnectApi.adminResumeOnboardingLink>>);
    mockUseAdminStripeStatus.mockReturnValue(buildHookReturn('identity_pending'));
    renderWithProviders(<StripePayoutsSection />);

    await userEvent.click(screen.getByRole('button', { name: /resume onboarding/i }));
    await waitFor(() => expect(mockResume).toHaveBeenCalledWith('identity'));
    await waitFor(() => expect(window.location.href).toBe('https://stripe.test/onboarding/abc'));
  });

  it('clicking Add bank account mints a bank-scoped link', async () => {
    mockResume.mockResolvedValueOnce({
      data: { url: 'https://stripe.test/bank/xyz', expiresAt: '2026-04-24T12:05:00Z' },
    } as Awaited<ReturnType<typeof stripeConnectApi.adminResumeOnboardingLink>>);
    mockUseAdminStripeStatus.mockReturnValue(buildHookReturn('needs_bank'));
    renderWithProviders(<StripePayoutsSection />);

    await userEvent.click(screen.getByRole('button', { name: /add bank account/i }));
    await waitFor(() => expect(mockResume).toHaveBeenCalledWith('bank'));
    await waitFor(() => expect(window.location.href).toBe('https://stripe.test/bank/xyz'));
  });
});

describe('StripePayoutsSection — refresh nonce', () => {
  it('triggers refresh when refreshNonce changes', () => {
    const ret = buildHookReturn('active', {
      bankAccountLast4: '**** 4242',
      expressDashboardUrl: 'https://dashboard.stripe.com/connect/accounts/acct_test',
      stripeAccount: {
        accountId: 'acct_test',
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
        requirementsCurrentlyDue: [],
      },
    });
    mockUseAdminStripeStatus.mockReturnValue(ret);
    const { rerender } = renderWithProviders(<StripePayoutsSection refreshNonce="initial" />);
    rerender(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <App><StripePayoutsSection refreshNonce="updated" /></App>
      </QueryClientProvider>,
    );
    expect(ret.refresh).toHaveBeenCalled();
  });
});

describe('StripePayoutsSection — mobile snapshot (360px)', () => {
  it('mobile flag swaps the dashboard CTA label', () => {
    mockUseIsMobile.mockReturnValue(true);
    mockUseAdminStripeStatus.mockReturnValue(
      buildHookReturn('active', {
        bankAccountLast4: '**** 4242',
        expressDashboardUrl: 'https://dashboard.stripe.com/connect/accounts/acct_test',
        stripeAccount: {
          accountId: 'acct_test',
          chargesEnabled: true,
          payoutsEnabled: true,
          detailsSubmitted: true,
          requirementsCurrentlyDue: [],
        },
      }),
    );
    const { container } = renderWithProviders(<StripePayoutsSection />);
    expect(screen.getByText('Open Stripe')).toBeInTheDocument();
    expect(screen.queryByText('Open Stripe Express dashboard')).not.toBeInTheDocument();
    expect(container.firstChild).toMatchSnapshot('mobile-active-state');
  });

  it('mobile resume button takes 100% width via inline style', () => {
    mockUseIsMobile.mockReturnValue(true);
    mockUseAdminStripeStatus.mockReturnValue(buildHookReturn('identity_pending'));
    renderWithProviders(<StripePayoutsSection />);
    const btn = screen.getByRole('button', { name: /resume onboarding/i });
    expect(btn.getAttribute('style')).toContain('width: 100%');
    expect(btn.getAttribute('style')).toContain('min-height: 44px');
  });
});
