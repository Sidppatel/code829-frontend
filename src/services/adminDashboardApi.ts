import apiClient from '../lib/axios';
import type { DashboardStats, NextEventDashboard } from '../types/developer';

export const adminDashboardApi = {
  getStats: () =>
    apiClient.get<DashboardStats>('/admin/dashboard'),

  getNextEvent: () =>
    apiClient.get<{ hasUpcoming: boolean; data?: NextEventDashboard }>('/admin/dashboard/next-event'),
};
