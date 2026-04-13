import apiClient from '@code829/shared/lib/axios';
import type { TableLock } from '@code829/shared/types/layout';

export const tableBookingApi = {
  lockTable: (eventId: string, tableId: string) =>
    apiClient.post<TableLock>('/tables/lock', { eventId, tableId }),

  releaseTable: (eventId: string, tableId: string) =>
    apiClient.post<{ message: string }>('/tables/release', { eventId, tableId }),

  getMyLocks: (eventId: string) =>
    apiClient.get<TableLock[]>(`/tables/my-locks/${eventId}`),
};
