import apiClient from '../lib/axios';
import type { EventTableType } from '../types/layout';

export interface TablePayload {
  id?: string;
  label: string;
  gridRow: number;
  gridCol: number;
  isActive: boolean;
  sortOrder?: number;
  eventTableId: string;
}

export interface SaveLayoutPayload {
  gridRows?: number;
  gridCols?: number;
  tables: TablePayload[];
}

export interface CreateTableTemplatePayload {
  name: string;
  defaultCapacity: number;
  defaultShape: string;
  defaultColor?: string;
  defaultPriceCents?: number;
  isActive?: boolean;
}

export interface CreateEventTablePayload {
  tableTemplateId?: string;
  label: string;
  capacity: number;
  shape: string;
  color?: string;
  priceCents: number;
}

export interface UpdateEventTablePayload {
  label?: string;
  capacity?: number;
  shape?: string;
  color?: string;
  priceCents?: number;
  isActive?: boolean;
}

export const adminLayoutApi = {
  // ── Table Templates (global) ─────────────────────
  listTableTemplates: () =>
    apiClient.get('/admin/table-templates'),

  createTableTemplate: (data: CreateTableTemplatePayload) =>
    apiClient.post('/admin/table-templates', data),

  updateTableTemplate: (id: string, data: CreateTableTemplatePayload) =>
    apiClient.put(`/admin/table-templates/${id}`, data),

  deleteTableTemplate: (id: string) =>
    apiClient.delete(`/admin/table-templates/${id}`),

  // ── Event Tables (per-event table types) ─────────
  listEventTables: (eventId: string) =>
    apiClient.get<EventTableType[]>(`/admin/events/${eventId}/event-tables`),

  createEventTable: (eventId: string, data: CreateEventTablePayload) =>
    apiClient.post<EventTableType>(`/admin/events/${eventId}/event-tables`, data),

  updateEventTable: (eventId: string, id: string, data: UpdateEventTablePayload) =>
    apiClient.put<EventTableType>(`/admin/events/${eventId}/event-tables/${id}`, data),

  deleteEventTable: (eventId: string, id: string) =>
    apiClient.delete(`/admin/events/${eventId}/event-tables/${id}`),

  // ── Layout ───────────────────────────────────────
  getLayout: (eventId: string) =>
    apiClient.get(`/admin/events/${eventId}/layout`),

  saveLayout: (eventId: string, payload: SaveLayoutPayload) =>
    apiClient.post(`/admin/events/${eventId}/layout`, payload),

  getDraft: (eventId: string) =>
    apiClient.get(`/admin/events/${eventId}/layout/draft`),

  saveDraft: (eventId: string, payload: SaveLayoutPayload) =>
    apiClient.post(`/admin/events/${eventId}/layout/draft`, payload),

  flushDraft: (eventId: string) =>
    apiClient.post(`/admin/events/${eventId}/layout/flush`),

  addTable: (eventId: string, payload: Omit<TablePayload, 'id'>) =>
    apiClient.post(`/admin/events/${eventId}/layout/table`, payload),

  updateTable: (eventId: string, tableId: string, payload: Partial<TablePayload>) =>
    apiClient.put(`/admin/events/${eventId}/layout/table/${tableId}`, payload),

  deleteTable: (eventId: string, tableId: string) =>
    apiClient.delete(`/admin/events/${eventId}/layout/table/${tableId}`),

  getLayoutStatus: (eventId: string) =>
    apiClient.get(`/admin/events/${eventId}/layout/status`),

  getLockedTables: (eventId: string) =>
    apiClient.get<{ layoutLocked: boolean; lockedTableIds: string[] }>(`/admin/events/${eventId}/layout/locked`),

  getLayoutStats: (eventId: string) =>
    apiClient.get(`/admin/events/${eventId}/layout/stats`),

  bulkInsertTables: (eventId: string, eventTableIds: string[]) =>
    apiClient.post(`/admin/events/${eventId}/layout/bulk-insert`, { eventTableIds }),
};
