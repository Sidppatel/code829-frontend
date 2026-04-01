import apiClient from '../lib/axios';
import type { SeatHold } from '../types/layout';

export const seatsApi = {
  getLayout: (venueId: string, eventId?: string) =>
    apiClient.get(`/seats/layout/${venueId}`, { params: { eventId } }),

  holdSeat: (eventId: string, seatId: string, ticketTypeId: string) =>
    apiClient.post<SeatHold>('/seats/hold', { eventId, seatId, ticketTypeId }),

  releaseSeat: (eventId: string, seatId: string) =>
    apiClient.post('/seats/release', { eventId, seatId }),

  getMyHolds: (eventId: string) =>
    apiClient.get<SeatHold[]>(`/seats/holds/${eventId}`),

  holdTable: (eventId: string, tableId: string, ticketTypeId: string) =>
    apiClient.post<SeatHold[]>('/seats/hold-table', { eventId, tableId, ticketTypeId }),

  releaseTable: (eventId: string, tableId: string) =>
    apiClient.post('/seats/release-table', { eventId, tableId }),
};
