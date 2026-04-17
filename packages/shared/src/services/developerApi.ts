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
  body: string;
  status: string;
  timestamp: string;
}

export interface AppSetting {
  key: string;
  value: string;
  description?: string;
  updatedAt?: string;
}

export interface SecretStatus {
  key: string;
  configured: boolean;
  description?: string;
}

export interface SettingsResponse {
  settings: AppSetting[];
  secrets: SecretStatus[];
}

export interface DevUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface EventFeeInfo {
  eventId: string;
  title: string;
  layoutMode: 'Open' | 'Grid';
  pricePerPersonCents: number | null;
  maxCapacity: number | null;
  defaultFeeCents: number;
  tableTypes: Array<{
    id: string;
    label: string;
    priceCents: number;
    platformFeeCents: number | null;
    isLocked: boolean;
  }>;
  ticketTypes: Array<{
    id: string;
    label: string;
    priceCents: number;
    platformFeeCents: number | null;
    isLocked: boolean;
  }>;
}

export interface DevEventListItem {
  id: string;
  title: string;
  status: string;
  startDate: string;
  layoutMode: string;
}

export const developerApi = {
  getEmailLogs: (params?: { page?: number; pageSize?: number; recipient?: string }) =>
    apiClient.get<PagedResponse<EmailLogEntry>>('/developer/email-log', { params }),

  getDevLogs: (params?: DevLogParams) =>
    apiClient.get<PagedResponse<DevLogEntry>>('/developer/logs', { params }),

  getSystemLogs: (params?: { pageSize?: number; after?: string; category?: string; entityType?: string }) =>
    apiClient.get('/developer/system-logs', { params }),

  getSettings: () =>
    apiClient.get<SettingsResponse>('/developer/settings'),

  updateSetting: (key: string, value: string) =>
    apiClient.put('/developer/settings', { key, value }),

  getUsers: (params?: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.get<PagedResponse<DevUser>>('/developer/users', { params }),

  updateUserStatus: (id: string, isActive: boolean) =>
    apiClient.put(`/developer/users/${id}/status`, isActive),

  deleteUser: (id: string) =>
    apiClient.delete(`/developer/users/${id}`),

  getEvents: (params?: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.get<PagedResponse<DevEventListItem>>('/developer/events', { params }),

  getEventFees: (eventId: string) =>
    apiClient.get<EventFeeInfo>(`/developer/events/${eventId}/fees`),

  updateTableTypeFees: (eventId: string, tableTypeFees: Record<string, number | null>) =>
    apiClient.put(`/developer/events/${eventId}/table-fees`, { tableTypeFees }),

  updateTicketTypeFees: (eventId: string, ticketTypeFees: Record<string, number | null>) =>
    apiClient.put(`/developer/events/${eventId}/ticket-type-fees`, { ticketTypeFees }),
};
