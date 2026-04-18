import { dashboardService } from './DashboardService';

export const adminDashboardApi = {
  getStats: dashboardService.getStats,
  getNextEvent: dashboardService.getNextEvent,
};
