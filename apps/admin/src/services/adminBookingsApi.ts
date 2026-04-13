import apiClient from '@code829/shared/lib/axios';
import type { Booking } from '@code829/shared/types/booking';
import type { PagedResponse } from '@code829/shared/types/shared';

export interface AdminBookingListParams extends Record<string, unknown> {
  page?: number;
  pageSize?: number;
  status?: string;
  eventId?: string;
  search?: string;
}

export const adminBookingsApi = {
  list: (params?: AdminBookingListParams) =>
    apiClient.get<PagedResponse<Booking>>('/admin/bookings', { params }),

  getStats: (eventId?: string) =>
    apiClient.get('/admin/bookings/stats', { params: eventId ? { eventId } : {} }),

  refund: (id: string) =>
    apiClient.post(`/admin/bookings/${id}/refund`),

  exportCsv: (eventId?: string) =>
    apiClient.get('/admin/bookings/export/csv', {
      params: eventId ? { eventId } : {},
      responseType: 'blob',
    }),

  exportXlsx: (eventId?: string) =>
    apiClient.get('/admin/bookings/export/xlsx', {
      params: eventId ? { eventId } : {},
      responseType: 'blob',
    }),
};
