import apiClient from '../lib/axios';
import type { Booking, BookingDetail } from '../types/booking';
import type { PagedResponse } from '../types/shared';

export interface CreateBookingRequest {
  eventId: string;
  tableId?: string;
  seatsReserved?: number;
}

export const bookingsApi = {
  create: (request: CreateBookingRequest) =>
    apiClient.post<Booking>('/bookings', request),

  confirmPayment: (id: string) =>
    apiClient.post<BookingDetail>(`/bookings/${id}/confirm`),

  cancel: (id: string) =>
    apiClient.post<BookingDetail>(`/bookings/${id}/cancel`),

  getById: (id: string) =>
    apiClient.get<BookingDetail>(`/bookings/${id}`),

  getMine: (page = 1, pageSize = 20, search?: string) =>
    apiClient.get<PagedResponse<Booking>>('/bookings/mine', { params: { page, pageSize, search: search || undefined } }),

  getQrCode: (id: string) =>
    apiClient.get(`/bookings/${id}/qr`, { responseType: 'blob' }),
};
