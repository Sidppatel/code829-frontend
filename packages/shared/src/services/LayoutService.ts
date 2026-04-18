import { BaseService } from './BaseService';
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

export class LayoutService extends BaseService {
  private static _instance: LayoutService | null = null;
  static getInstance(): LayoutService {
    return (this._instance ??= new LayoutService());
  }
  private constructor() {
    super('LayoutService');
  }

  // ── Table templates ─────────────────────────────
  listTableTemplates = () => this.get('/admin/table-templates');

  createTableTemplate = (data: CreateTableTemplatePayload) =>
    this.post('/admin/table-templates', data);

  updateTableTemplate = (id: string, data: CreateTableTemplatePayload) =>
    this.put(`/admin/table-templates/${id}`, data);

  deleteTableTemplate = (id: string) => this.delete(`/admin/table-templates/${id}`);

  // ── Event tables ────────────────────────────────
  listEventTables = (eventId: string) =>
    this.get<EventTableType[]>(`/admin/events/${eventId}/event-tables`);

  createEventTable = (eventId: string, data: CreateEventTablePayload) =>
    this.post<EventTableType>(`/admin/events/${eventId}/event-tables`, data);

  updateEventTable = (eventId: string, id: string, data: UpdateEventTablePayload) =>
    this.put<EventTableType>(`/admin/events/${eventId}/event-tables/${id}`, data);

  deleteEventTable = (eventId: string, id: string) =>
    this.delete(`/admin/events/${eventId}/event-tables/${id}`);

  // ── Layout ──────────────────────────────────────
  getLayout = (eventId: string) => this.get(`/admin/events/${eventId}/layout`);

  saveLayout = (eventId: string, payload: SaveLayoutPayload) =>
    this.post(`/admin/events/${eventId}/layout`, payload);

  getDraft = (eventId: string) => this.get(`/admin/events/${eventId}/layout/draft`);

  saveDraft = (eventId: string, payload: SaveLayoutPayload) =>
    this.post(`/admin/events/${eventId}/layout/draft`, payload);

  flushDraft = (eventId: string) =>
    this.post(`/admin/events/${eventId}/layout/flush`);

  addTable = (eventId: string, payload: Omit<TablePayload, 'id'>) =>
    this.post(`/admin/events/${eventId}/layout/table`, payload);

  updateTable = (eventId: string, tableId: string, payload: Partial<TablePayload>) =>
    this.put(`/admin/events/${eventId}/layout/table/${tableId}`, payload);

  deleteTable = (eventId: string, tableId: string) =>
    this.delete(`/admin/events/${eventId}/layout/table/${tableId}`);

  getLayoutStatus = (eventId: string) =>
    this.get(`/admin/events/${eventId}/layout/status`);

  getLockedTables = (eventId: string) =>
    this.get<{ layoutLocked: boolean; lockedTableIds: string[] }>(
      `/admin/events/${eventId}/layout/locked`,
    );

  getLayoutStats = (eventId: string) =>
    this.get(`/admin/events/${eventId}/layout/stats`);

  bulkInsertTables = (eventId: string, eventTableIds: string[]) =>
    this.post(`/admin/events/${eventId}/layout/bulk-insert`, { eventTableIds });
}

export const layoutService = LayoutService.getInstance();
