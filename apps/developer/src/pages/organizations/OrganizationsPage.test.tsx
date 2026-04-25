import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from 'antd';
import OrganizationsPage from './OrganizationsPage';
import type {
  OrganizationDetail,
  OrganizationListItem,
} from '@code829/shared/types/organizations';

// Mock both APIs the page touches. Keeps the test hermetic — no axios at all.
vi.mock('@code829/shared/services/organizationsApi', () => ({
  organizationsApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
  },
}));

vi.mock('@code829/shared/services/stripeConnectApi', () => ({
  stripeConnectApi: {
    developerStartOnboarding: vi.fn(),
    developerGetOnboardingLink: vi.fn(),
    developerEmailOnboardingLink: vi.fn(),
    developerGetStripeStatus: vi.fn(),
    adminGetStripeStatus: vi.fn(),
    adminResumeOnboardingLink: vi.fn(),
  },
}));

// Components inside the page reach for /admin/staff list to seed the member
// pickers; stub the raw axios client so they don't crash.
vi.mock('@code829/shared/lib/axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { items: [] } }),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Each child overlay has its own dedicated tests; stub them so the listing
// tests don't need to wire QueryClient/router/etc. for unrelated children.
vi.mock('./components/OrganizationDetailDrawer', () => ({
  default: ({ open, organization }: { open: boolean; organization: { id?: string } | null }) =>
    open && organization ? (
      <div data-testid="detail-drawer" data-org-id={organization.id} />
    ) : null,
}));

vi.mock('./components/MembersDrawer', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="members-drawer" /> : null,
}));

vi.mock('./components/StripeOnboardingModal', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="stripe-onboarding-modal" /> : null,
}));

vi.mock('./components/NewOrganizationModal', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="new-org-modal">New Organization Modal</div> : null,
}));

import { organizationsApi } from '@code829/shared/services/organizationsApi';
import { stripeConnectApi } from '@code829/shared/services/stripeConnectApi';

const mockList = vi.mocked(organizationsApi.list);
const mockGetById = vi.mocked(organizationsApi.getById);
const mockStartOnboarding = vi.mocked(stripeConnectApi.developerStartOnboarding);

const orgRow: OrganizationListItem = {
  id: 'org-1',
  name: 'Acme Productions',
  countryCode: 'US',
  hasStripeAccount: true,
  stripeChargesEnabled: true,
  stripePayoutsEnabled: true,
  stripeDetailsSubmitted: true,
  stripeState: 'active',
  memberCount: 3,
  archivedAt: null,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-15T00:00:00Z',
};

const orgRowSecondary: OrganizationListItem = {
  ...orgRow,
  id: 'org-2',
  name: 'Beta Events',
  hasStripeAccount: false,
  stripeChargesEnabled: false,
  stripePayoutsEnabled: false,
  stripeDetailsSubmitted: false,
  stripeState: 'not_started',
  memberCount: 1,
};

const orgDetail: OrganizationDetail = {
  ...orgRow,
  legalName: 'Acme Productions LLC',
  stripeConnectedAccountId: 'acct_test_1',
  stripeOnboardedAt: '2026-04-10T00:00:00Z',
  stripeRequirementsCurrentlyDue: [],
  members: [
    { businessUserId: 'bu-1', firstName: 'Alice', lastName: 'Adams', email: 'alice@x.com', role: 'Admin' },
  ],
};

function renderPage() {
  return render(
    <App>
      <OrganizationsPage />
    </App>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom doesn't ship matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('OrganizationsPage — listing', () => {
  it('renders the page title + total count from the API', async () => {
    mockList.mockResolvedValue({
      data: { items: [orgRow, orgRowSecondary], totalCount: 2, page: 1, pageSize: 25 },
    } as Awaited<ReturnType<typeof organizationsApi.list>>);
    renderPage();
    expect(await screen.findByText('Organizations')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/2 organizations/i)).toBeInTheDocument());
  });

  it('renders each organization name in the table', async () => {
    mockList.mockResolvedValue({
      data: { items: [orgRow, orgRowSecondary], totalCount: 2, page: 1, pageSize: 25 },
    } as Awaited<ReturnType<typeof organizationsApi.list>>);
    renderPage();
    expect(await screen.findByText('Acme Productions')).toBeInTheDocument();
    expect(await screen.findByText('Beta Events')).toBeInTheDocument();
  });

  it('renders Stripe state chips per row', async () => {
    mockList.mockResolvedValue({
      data: { items: [orgRow, orgRowSecondary], totalCount: 2, page: 1, pageSize: 25 },
    } as Awaited<ReturnType<typeof organizationsApi.list>>);
    renderPage();
    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(await screen.findByText('Not Started')).toBeInTheDocument();
  });

  it('shows the empty state when no orgs exist', async () => {
    mockList.mockResolvedValue({
      data: { items: [], totalCount: 0, page: 1, pageSize: 25 },
    } as Awaited<ReturnType<typeof organizationsApi.list>>);
    renderPage();
    expect(await screen.findByText(/no organizations yet/i)).toBeInTheDocument();
  });

  it('refresh button reloads the listing', async () => {
    mockList.mockResolvedValue({
      data: { items: [orgRow], totalCount: 1, page: 1, pageSize: 25 },
    } as Awaited<ReturnType<typeof organizationsApi.list>>);
    renderPage();
    await screen.findByText('Acme Productions');
    mockList.mockClear();
    const refreshBtn = screen.getByRole('button', { name: /refresh/i });
    await userEvent.click(refreshBtn);
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(1));
  });
});

describe('OrganizationsPage — overlay flows', () => {
  beforeEach(() => {
    mockList.mockResolvedValue({
      data: { items: [orgRow], totalCount: 1, page: 1, pageSize: 25 },
    } as Awaited<ReturnType<typeof organizationsApi.list>>);
  });

  it('clicking a row opens the detail drawer (fetches by id)', async () => {
    mockGetById.mockResolvedValueOnce({
      data: orgDetail,
    } as Awaited<ReturnType<typeof organizationsApi.getById>>);
    renderPage();
    const row = await screen.findByText('Acme Productions');
    await userEvent.click(row);
    await waitFor(() => expect(mockGetById).toHaveBeenCalledWith('org-1'));
  });

  it('"New Organization" button opens the create modal', async () => {
    renderPage();
    await screen.findByText('Acme Productions');
    const newBtn = screen.getByRole('button', { name: /new organization/i });
    await userEvent.click(newBtn);
    await waitFor(() => {
      expect(screen.getByTestId('new-org-modal')).toBeInTheDocument();
    });
  });

  it('search input updates and resets pagination', async () => {
    renderPage();
    await screen.findByText('Acme Productions');
    const searchInput = screen.getByPlaceholderText(/search by name or legal name/i);
    mockList.mockClear();
    await userEvent.type(searchInput, 'acme');
    await waitFor(() => {
      const lastCall = mockList.mock.calls.at(-1);
      expect(lastCall?.[0]).toMatchObject({ search: expect.stringContaining('acme'), page: 1 });
    });
  });

  it('developerStartOnboarding stub is wired so future tests can invoke it', () => {
    // The page composes a StripeOnboardingModal that calls
    // stripeConnectApi.developerStartOnboarding under the hood. We mock the
    // module factory above; this test guards against silent re-exports that
    // would let the modal hit the real network in test mode.
    expect(mockStartOnboarding).toBeDefined();
    expect(vi.isMockFunction(mockStartOnboarding)).toBe(true);
  });
});

describe('OrganizationsPage — error path', () => {
  it('does not crash when list fails (error logged via App.message)', async () => {
    mockList.mockRejectedValueOnce(new Error('500'));
    renderPage();
    // Should still render the page shell — failure surfaces via toast, not crash
    expect(await screen.findByText('Organizations')).toBeInTheDocument();
  });
});
