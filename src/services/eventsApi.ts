import apiClient from '../lib/axios';

export const eventsApi = {
  list: <T = unknown>(queryString?: string) =>
    apiClient.get<T>(`/events${queryString ? `?${queryString}` : ''}`),

  getById: <T = unknown>(id: string) =>
    apiClient.get<T>(`/events/${id}`),

  getTables: <T = unknown>(eventId: string) =>
    apiClient.get<T>(`/events/${eventId}/tables`),
};

export const seatsApi = {
  getHolds: <T = unknown>(eventId: string) =>
    apiClient.get<T>(`/seats/holds/${eventId}`),

  hold: (eventId: string, tableId: string, ticketTypeId: string) =>
    apiClient.post('/seats/hold-table', { eventId, tableId, ticketTypeId }),

  release: (eventId: string, tableId: string) =>
    apiClient.post('/seats/release-table', { eventId, tableId }),
};
