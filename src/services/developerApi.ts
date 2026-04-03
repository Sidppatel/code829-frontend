import apiClient from '../lib/axios';
import type { PagedResponse } from '../types/shared';

export interface DevLogEntry {
  id: string;
  timestamp: string;
  severity: string;
  message: string;
  path?: string;
  method?: string;
  statusCode?: number;
}

export interface DevLogParams extends Record<string, unknown> {
  page?: number;
  pageSize?: number;
  severity?: string;
  path?: string;
  from?: string;
  to?: string;
}

export interface EmailLogEntry {
  id: string;
  recipient: string;
  subject: string;
  status: string;
  sentAt: string;
}

export interface AppSetting {
  key: string;
  value: string;
  description?: string;
}

export interface DevUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

export interface EventFeeInfo {
  eventId: string;
  title: string;
  layoutMode: 'Open' | 'Grid';
  platformFeeCents: number | null;
  defaultFeeCents: number;
  tableTypes: Array<{
    id: string;
    label: string;
    priceCents: number;
    platformFeeCents: number | null;
  }>;
}

export interface DevEventListItem {
  id: string;
  title: string;
  status: string;
  startDate: string;
  layoutMode: string;
  platformFeeCents: number | null;
}

export const developerApi = {
  getEmailLogs: (params?: { page?: number; pageSize?: number; recipient?: string }) =>
    apiClient.get<PagedResponse<EmailLogEntry>>('/developer/email-log', { params }),

  getDevLogs: (params?: DevLogParams) =>
    apiClient.get<PagedResponse<DevLogEntry>>('/developer/logs', { params }),

  getSystemLogs: (params?: { pageSize?: number; after?: string; category?: string; entityType?: string }) =>
    apiClient.get('/developer/system-logs', { params }),

  getSettings: () =>
    apiClient.get<AppSetting[]>('/developer/settings'),

  updateSetting: (key: string, value: string) =>
    apiClient.put('/developer/settings', { key, value }),

  getUsers: () =>
    apiClient.get<DevUser[]>('/developer/users'),

  updateUserRole: (id: string, role: string) =>
    apiClient.put(`/developer/users/${id}/role`, { role }),

  getEvents: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get<PagedResponse<DevEventListItem>>('/developer/events', { params }),

  getEventFees: (eventId: string) =>
    apiClient.get<EventFeeInfo>(`/developer/events/${eventId}/fees`),

  updateEventFee: (eventId: string, platformFeeCents: number | null) =>
    apiClient.put(`/developer/events/${eventId}/fees`, { platformFeeCents }),

  updateTableTypeFees: (eventId: string, tableTypeFees: Record<string, number | null>) =>
    apiClient.put(`/developer/events/${eventId}/table-fees`, { tableTypeFees }),
};
