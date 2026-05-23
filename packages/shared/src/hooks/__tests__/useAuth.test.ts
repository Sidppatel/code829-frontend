import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { useAuthStore } from '../../stores/authStore';
import type { UserProfile } from '../../types/auth';

const mockUser: UserProfile = {
  id: 'u-1',
  email: 'auth@test.com',
  firstName: 'Auth',
  lastName: 'Tester',
  role: 'User',
  optInLocationEmail: false,
  hasCompletedOnboarding: true,
  createdAt: '2025-01-01T00:00:00Z',
  hasPassword: true,
  hasGoogle: false,
  emailVerified: true,
};

const adminUser: UserProfile = {
  ...mockUser,
  id: 'u-2',
  role: 'Admin',
};

beforeEach(() => {
  useAuthStore.setState({ user: null, isHydrated: false });
});

describe('useAuth', () => {
  it('returns null user when not logged in', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });

  it('isAuthenticated is false when user is null', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('isAuthenticated is true after setUser', () => {
    const { result } = renderHook(() => useAuth());
    act(() => result.current.setUser(mockUser));
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('user matches after setUser', () => {
    const { result } = renderHook(() => useAuth());
    act(() => result.current.setUser(mockUser));
    expect(result.current.user).toEqual(mockUser);
  });

  it('logout clears user and sets isAuthenticated false', () => {
    useAuthStore.setState({ user: mockUser, isHydrated: true });
    const { result } = renderHook(() => useAuth());
    act(() => result.current.logout());
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  describe('hasRole', () => {
    it('User has role User', () => {
      useAuthStore.setState({ user: mockUser, isHydrated: true });
      const { result } = renderHook(() => useAuth());
      expect(result.current.hasRole('User')).toBe(true);
    });

    it('User does not have role Admin', () => {
      useAuthStore.setState({ user: mockUser, isHydrated: true });
      const { result } = renderHook(() => useAuth());
      expect(result.current.hasRole('Admin')).toBe(false);
    });

    it('Admin satisfies User role requirement', () => {
      useAuthStore.setState({ user: adminUser, isHydrated: true });
      const { result } = renderHook(() => useAuth());
      expect(result.current.hasRole('User')).toBe(true);
    });

    it('hasRole returns false when user is null', () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.hasRole('User')).toBe(false);
    });
  });
});
