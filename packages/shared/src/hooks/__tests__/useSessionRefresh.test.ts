import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSessionRefresh } from '../useSessionRefresh';
import { useAuthStore } from '../../stores/authStore';
import type { UserProfile } from '../../types/auth';

vi.mock('../../lib/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

import apiClient from '../../lib/axios';
const mockGet = vi.mocked(apiClient.get);

const mockUser: UserProfile = {
  id: 'refresh-1',
  email: 'refresh@test.com',
  firstName: 'Session',
  lastName: 'User',
  role: 'User',
  optInLocationEmail: false,
  hasCompletedOnboarding: true,
  createdAt: '2025-01-01T00:00:00Z',
};

beforeEach(() => {
  useAuthStore.setState({ user: null, isHydrated: false });
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useSessionRefresh', () => {
  it('calls /auth/me on mount with no cached user', async () => {
    mockGet.mockResolvedValueOnce({ data: mockUser });
    renderHook(() => useSessionRefresh());
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/auth/me'));
  });

  it('sets isHydrated true after probe resolves (no cached user)', async () => {
    mockGet.mockResolvedValueOnce({ data: mockUser });
    renderHook(() => useSessionRefresh());
    await waitFor(() => expect(useAuthStore.getState().isHydrated).toBe(true));
  });

  it('populates store with user from /auth/me response', async () => {
    mockGet.mockResolvedValueOnce({ data: mockUser });
    renderHook(() => useSessionRefresh());
    await waitFor(() => expect(useAuthStore.getState().user?.id).toBe('refresh-1'));
  });

  it('sets isHydrated true even when /auth/me returns 401', async () => {
    mockGet.mockRejectedValueOnce(Object.assign(new Error('401'), { response: { status: 401 } }));
    renderHook(() => useSessionRefresh());
    await waitFor(() => expect(useAuthStore.getState().isHydrated).toBe(true));
  });

  it('sets isHydrated immediately when user is cached (fast path)', async () => {
    useAuthStore.setState({ user: mockUser, isHydrated: false });
    mockGet.mockImplementationOnce(
      () => new Promise((res) => setTimeout(() => res({ data: mockUser }), 50)),
    );
    renderHook(() => useSessionRefresh());
    expect(useAuthStore.getState().isHydrated).toBe(true);
  });

  it('uses custom meEndpoint when provided', async () => {
    mockGet.mockResolvedValueOnce({ data: mockUser });
    renderHook(() => useSessionRefresh('/admin/auth/me'));
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/admin/auth/me'));
  });
});
