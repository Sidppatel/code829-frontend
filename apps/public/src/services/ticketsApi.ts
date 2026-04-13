import apiClient from '@code829/shared/lib/axios';
import type { BookingTicket, GuestTicket, TicketClaimInfo } from '@code829/shared/types/ticket';

export const ticketsApi = {
  getForBooking: (bookingId: string) =>
    apiClient.get<BookingTicket[]>(`/bookings/${bookingId}/tickets`),

  getTicketQr: (bookingId: string, ticketId: string) =>
    apiClient.get(`/bookings/${bookingId}/tickets/${ticketId}/qr`, { responseType: 'blob' }),

  invite: (bookingId: string, ticketId: string, email: string, guestName?: string) =>
    apiClient.post(`/bookings/${bookingId}/tickets/${ticketId}/invite`, { email, guestName }),

  revoke: (bookingId: string, ticketId: string) =>
    apiClient.post(`/bookings/${bookingId}/tickets/${ticketId}/revoke`),

  getClaimInfo: (token: string) =>
    apiClient.get<TicketClaimInfo>('/tickets/claim', { params: { token } }),

  claim: (token: string) =>
    apiClient.post<{ message: string; ticketId: string }>('/tickets/claim', { token }),

  getMine: () =>
    apiClient.get<GuestTicket[]>('/tickets/mine'),

  getMyTicketQr: (ticketId: string) =>
    apiClient.get(`/tickets/${ticketId}/qr`, { responseType: 'blob' }),
};
