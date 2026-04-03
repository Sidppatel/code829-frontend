import apiClient from '../lib/axios';

export interface TablePayload {
  id?: string;
  label: string;
  capacity: number;
  shape: string;
  color?: string;
  priceType?: string;
  priceCents: number;
  isActive: boolean;
  posX: number;
  posY: number;
  sortOrder?: number;
  tableTypeId?: string;
}

export interface SaveLayoutPayload {
  editorMode?: string;
  gridRows?: number;
  gridCols?: number;
  tables: TablePayload[];
}

export interface CreateTableTypePayload {
  name: string;
  defaultCapacity: number;
  defaultShape: string;
  defaultColor?: string;
  defaultPriceCents?: number;
  isActive?: boolean;
}

export const adminLayoutApi = {
  listTableTypes: () =>
    apiClient.get('/admin/table-types'),

  createTableType: (data: CreateTableTypePayload) =>
    apiClient.post('/admin/table-types', data),

  updateTableType: (id: string, data: CreateTableTypePayload) =>
    apiClient.put(`/admin/table-types/${id}`, data),

  deleteTableType: (id: string) =>
    apiClient.delete(`/admin/table-types/${id}`),

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

  bulkInsertTables: (eventId: string, tableTypeIds: string[]) =>
    apiClient.post(`/admin/events/${eventId}/layout/bulk-insert`, { tableTypeIds }),
};
