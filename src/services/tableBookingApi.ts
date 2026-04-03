import apiClient from '../lib/axios';
import type { TableLock } from '../types/layout';

export const tableBookingApi = {
  lockTable: (eventId: string, tableId: string, ticketTypeId: string) =>
    apiClient.post<TableLock>('/tables/lock', { eventId, tableId, ticketTypeId }),

  releaseTable: (eventId: string, tableId: string) =>
    apiClient.post<{ message: string }>('/tables/release', { eventId, tableId }),

  getMyLocks: (eventId: string) =>
    apiClient.get<TableLock[]>(`/tables/my-locks/${eventId}`),
};
