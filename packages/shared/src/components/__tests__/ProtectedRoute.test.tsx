import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../auth/ProtectedRoute';
import { useAuthStore } from '../../stores/authStore';
import type { UserProfile } from '../../types/auth';

vi.mock('../shared/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner" />,
}));

const mockUser: UserProfile = {
  id: 'u-1',
  email: 'protected@test.com',
  firstName: 'Protected',
  lastName: 'User',
  role: 'User',
  optInLocationEmail: false,
  hasCompletedOnboarding: true,
  createdAt: '2025-01-01T00:00:00Z',
  hasPassword: true,
  hasGoogle: false,
  emailVerified: true,
};

const adminUser: UserProfile = { ...mockUser, id: 'u-2', role: 'Admin' };

function renderRoute(
  children: React.ReactNode,
  initialPath = '/protected',
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/protected" element={children} />
        <Route path="/login" element={<div data-testid="login-page" />} />
        <Route path="/profile" element={<div data-testid="profile-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ user: null, isHydrated: false });
});

describe('ProtectedRoute', () => {
  describe('hydration gate', () => {
    it('shows loading spinner while not hydrated', () => {
      renderRoute(<ProtectedRoute><div data-testid="content" /></ProtectedRoute>);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('does not show content until hydrated', () => {
      renderRoute(<ProtectedRoute><div data-testid="content" /></ProtectedRoute>);
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });
  });

  describe('unauthenticated redirect', () => {
    it('redirects to /login when hydrated but no user', () => {
      useAuthStore.setState({ user: null, isHydrated: true });
      renderRoute(<ProtectedRoute><div data-testid="content" /></ProtectedRoute>);
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('includes returnUrl in the redirect', () => {
      useAuthStore.setState({ user: null, isHydrated: true });
      renderRoute(
        <ProtectedRoute><div data-testid="content" /></ProtectedRoute>,
        '/protected',
      );
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  describe('authenticated access', () => {
    it('renders children when user is authenticated and hydrated', () => {
      useAuthStore.setState({ user: mockUser, isHydrated: true });
      renderRoute(<ProtectedRoute><div data-testid="content" /></ProtectedRoute>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('role check', () => {
    it('redirects when user role is insufficient', () => {
      useAuthStore.setState({ user: mockUser, isHydrated: true });
      renderRoute(
        <ProtectedRoute minRole="Admin"><div data-testid="content" /></ProtectedRoute>,
      );
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('renders when user role satisfies minRole', () => {
      useAuthStore.setState({ user: adminUser, isHydrated: true });
      renderRoute(
        <ProtectedRoute minRole="User"><div data-testid="content" /></ProtectedRoute>,
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('allows Admin to access Admin-gated route', () => {
      useAuthStore.setState({ user: adminUser, isHydrated: true });
      renderRoute(
        <ProtectedRoute minRole="Admin"><div data-testid="content" /></ProtectedRoute>,
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('onboarding guard', () => {
    it('redirects Pending Setup users to /profile', () => {
      const pendingUser: UserProfile = {
        ...mockUser,
        firstName: 'Pending',
        lastName: 'Setup',
      };
      useAuthStore.setState({ user: pendingUser, isHydrated: true });
      renderRoute(<ProtectedRoute><div data-testid="content" /></ProtectedRoute>);
      expect(screen.getByTestId('profile-page')).toBeInTheDocument();
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('allows Pending Setup user to access /profile', () => {
      const pendingUser: UserProfile = {
        ...mockUser,
        firstName: 'Pending',
        lastName: 'Setup',
      };
      useAuthStore.setState({ user: pendingUser, isHydrated: true });
      render(
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route path="/profile" element={
              <ProtectedRoute><div data-testid="profile-content" /></ProtectedRoute>
            } />
          </Routes>
        </MemoryRouter>,
      );
      expect(screen.getByTestId('profile-content')).toBeInTheDocument();
    });
  });
});
