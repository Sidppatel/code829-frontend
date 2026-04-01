import apiClient from '../lib/axios';
import type { Booking } from '../types/booking';
import type { PagedResponse } from '../types/shared';

export interface AdminBookingListParams {
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
