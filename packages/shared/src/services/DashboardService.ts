import { BaseService } from './BaseService';
import type { DashboardStats, NextEventDashboard } from '../types/developer';

export class DashboardService extends BaseService {
  private static _instance: DashboardService | null = null;
  static getInstance(): DashboardService {
    return (this._instance ??= new DashboardService());
  }
  private constructor() {
    super('DashboardService');
  }

  getStats = () => this.get<DashboardStats>('/admin/dashboard');

  getNextEvent = () =>
    this.get<{ hasUpcoming: boolean; data?: NextEventDashboard }>(
      '/admin/dashboard/next-event',
    );
}

export const dashboardService = DashboardService.getInstance();
