import apiClient from '../lib/axios';

interface BookingItem {
  ticketTypeId: string;
  seatId?: string;
  quantity?: number;
}

interface GuestUpdateRequest {
  guestName: string | null;
  guestEmail: string | null;
  sendInvitation: boolean;
}

export const bookingsApi = {
  getMine: <T = unknown>() =>
    apiClient.get<T>('/bookings/mine'),

  create: (eventId: string, items: BookingItem[]) =>
    apiClient.post<{ id: string }>('/bookings', { eventId, items }),

  confirm: (bookingId: string) =>
    apiClient.post(`/bookings/${bookingId}/confirm`),

  getInvitation: <T = unknown>(token: string) =>
    apiClient.get<T>(`/bookings/invitation/${token}`),

  updateGuest: (bookingId: string, itemId: string, data: GuestUpdateRequest) =>
    apiClient.put(`/bookings/${bookingId}/items/${itemId}/guest`, data),
};
