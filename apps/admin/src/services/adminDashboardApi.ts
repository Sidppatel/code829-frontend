import apiClient from '@code829/shared/lib/axios';
import type { DashboardStats, NextEventDashboard } from '@code829/shared/types/developer';

export const adminDashboardApi = {
  getStats: () =>
    apiClient.get<DashboardStats>('/admin/dashboard'),

  getNextEvent: () =>
    apiClient.get<{ hasUpcoming: boolean; data?: NextEventDashboard }>('/admin/dashboard/next-event'),
};
