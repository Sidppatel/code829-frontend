import apiClient from '../lib/axios';
import type { Booking, BookingDetail } from '../types/booking';
import type { PagedResponse } from '../types/shared';

export interface CreateBookingItem {
  ticketTypeId: string;
  seatId?: string;
  quantity?: number;
}

export interface CreateTableBookingRequest {
  eventId: string;
  tableId: string;
  ticketTypeId: string;
}

export interface CreateCapacityBookingRequest {
  eventId: string;
  ticketTypeId: string;
  seatsReserved: number;
}

export const bookingsApi = {
  create: (eventId: string, items: CreateBookingItem[]) =>
    apiClient.post<{ id: string }>('/bookings', { eventId, items }),

  createTableBooking: (request: CreateTableBookingRequest) =>
    apiClient.post<Booking>('/bookings', {
      eventId: request.eventId,
      tableId: request.tableId,
      ticketTypeId: request.ticketTypeId,
      items: [],
    }),

  createCapacityBooking: (request: CreateCapacityBookingRequest) =>
    apiClient.post<Booking>('/bookings', {
      eventId: request.eventId,
      ticketTypeId: request.ticketTypeId,
      seatsReserved: request.seatsReserved,
      items: [],
    }),

  confirmPayment: (id: string) =>
    apiClient.post<BookingDetail>(`/bookings/${id}/confirm`),

  cancel: (id: string) =>
    apiClient.post<BookingDetail>(`/bookings/${id}/cancel`),

  getById: (id: string) =>
    apiClient.get<BookingDetail>(`/bookings/${id}`),

  getMine: (page = 1, pageSize = 20) =>
    apiClient.get<PagedResponse<Booking>>('/bookings/mine', { params: { page, pageSize } }),

  getQrCode: (id: string) =>
    apiClient.get(`/bookings/${id}/qr`, { responseType: 'blob' }),

  getInvitation: (token: string) =>
    apiClient.get(`/bookings/invitation/${token}`),

  updateGuest: (bookingId: string, itemId: string, data: {
    guestName: string | null;
    guestEmail: string | null;
    sendInvitation: boolean;
  }) => apiClient.put(`/bookings/${bookingId}/items/${itemId}/guest`, data),
};
