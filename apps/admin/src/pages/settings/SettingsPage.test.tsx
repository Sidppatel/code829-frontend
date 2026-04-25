import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SettingsPage from './SettingsPage';

// Stub child sections — both are covered by their own dedicated suites so this
// page test only needs to confirm SettingsPage *mounts* them and threads the
// refresh nonce into the payouts section.
vi.mock('@code829/shared/components/auth/AdminSecuritySection', () => ({
  default: () => <div data-testid="admin-security-section">Security Section</div>,
}));

vi.mock('@code829/shared/components/stripe/StripePayoutsSection', () => ({
  default: ({ refreshNonce }: { refreshNonce?: string | number }) => (
    <div data-testid="stripe-payouts-section" data-refresh-nonce={String(refreshNonce ?? '')}>
      Stripe Payouts Section
    </div>
  ),
}));

vi.mock('@code829/shared/components/shared/PageHeader', () => ({
  default: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <header>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  ),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/stripe/return" element={<SettingsPage />} />
        </Routes>
      </App>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SettingsPage — composition', () => {
  it('renders the page header', () => {
    renderAt('/settings');
    expect(screen.getByRole('heading', { level: 1, name: /settings/i })).toBeInTheDocument();
  });

  it('renders the security section', () => {
    renderAt('/settings');
    expect(screen.getByTestId('admin-security-section')).toBeInTheDocument();
  });

  it('mounts the Stripe payouts section', () => {
    renderAt('/settings');
    expect(screen.getByTestId('stripe-payouts-section')).toBeInTheDocument();
  });
});

describe('SettingsPage — Stripe return-URL handling', () => {
  it('threads a refreshNonce that includes the current path + query string', () => {
    renderAt('/settings?status=complete');
    const section = screen.getByTestId('stripe-payouts-section');
    const nonce = section.getAttribute('data-refresh-nonce') ?? '';
    expect(nonce).toContain('/settings');
    expect(nonce).toContain('status=complete');
  });

  it('treats the /settings/stripe/return path as a Stripe return signal', () => {
    renderAt('/settings/stripe/return');
    const section = screen.getByTestId('stripe-payouts-section');
    const nonce = section.getAttribute('data-refresh-nonce') ?? '';
    expect(nonce).toContain('/settings/stripe/return');
  });

  it('assigns different nonces for different URLs (refetch trigger)', () => {
    const { unmount } = renderAt('/settings');
    const baseNonce = screen
      .getByTestId('stripe-payouts-section')
      .getAttribute('data-refresh-nonce');
    unmount();

    renderAt('/settings?status=complete');
    const completeNonce = screen
      .getByTestId('stripe-payouts-section')
      .getAttribute('data-refresh-nonce');

    expect(completeNonce).not.toBe(baseNonce);
  });

  it('does NOT show the welcome-back toast on a plain /settings visit', async () => {
    renderAt('/settings');
    // antd renders message portals lazily; give it a tick then assert absent
    await waitFor(() => {
      expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument();
    });
  });
});
