import apiClient from '../lib/axios';

export const developerApi = {
  // ─── Dashboard ──────────────────────────────────────────────────────────────
  dashboard: {
    getNextEvent: <T = unknown>() =>
      apiClient.get<T>('/developer/dashboard/next-event'),

    getStats: <T = unknown>() =>
      apiClient.get<T>('/developer/dashboard'),
  },

  // ─── Events ─────────────────────────────────────────────────────────────────
  events: {
    list: <T = unknown>(params: Record<string, string | number | boolean>) =>
      apiClient.get<T>('/developer/events', { params }),

    getById: <T = unknown>(id: string) =>
      apiClient.get<T>(`/developer/events/${id}`),

    update: (id: string, payload: unknown) =>
      apiClient.put(`/developer/events/${id}`, payload),

    updateStatus: (id: string, status: string) =>
      apiClient.put(`/developer/events/${id}/status`, { status }),

    delete: (id: string) =>
      apiClient.delete(`/developer/events/${id}`),

    duplicate: (id: string, startDate: string, endDate: string) =>
      apiClient.post(`/developer/events/${id}/duplicate`, { startDate, endDate }),

    updatePlatformFees: (id: string, payload: unknown) =>
      apiClient.put(`/developer/events/${id}/platform-fees`, payload),
  },

  // ─── Layout ─────────────────────────────────────────────────────────────────
  layout: {
    get: <T = unknown>(eventId: string) =>
      apiClient.get<T>(`/developer/events/${eventId}/layout`),

    getDraft: <T = unknown>(eventId: string) =>
      apiClient.get<T>(`/developer/events/${eventId}/layout/draft`),

    saveDraft: (eventId: string, payload: unknown) =>
      apiClient.post(`/developer/events/${eventId}/layout/draft`, payload),

    save: (eventId: string, payload: unknown) =>
      apiClient.post(`/developer/events/${eventId}/layout`, payload),

    flush: (eventId: string) =>
      apiClient.post(`/developer/events/${eventId}/layout/flush`),
  },

  // ─── Pricing ────────────────────────────────────────────────────────────────
  pricing: {
    list: <T = unknown>(eventId: string) =>
      apiClient.get<T>(`/developer/events/${eventId}/pricing`),

    resolve: <T = unknown>(eventId: string) =>
      apiClient.get<T>(`/developer/events/${eventId}/pricing/resolve`),

    create: (eventId: string, payload: unknown) =>
      apiClient.post(`/developer/events/${eventId}/pricing`, payload),

    update: (eventId: string, ruleId: string, payload: unknown) =>
      apiClient.put(`/developer/events/${eventId}/pricing/${ruleId}`, payload),

    delete: (eventId: string, ruleId: string) =>
      apiClient.delete(`/developer/events/${eventId}/pricing/${ruleId}`),

    reorder: (eventId: string, payload: unknown) =>
      apiClient.put(`/developer/events/${eventId}/pricing/reorder`, payload),
  },

  // ─── Bookings ───────────────────────────────────────────────────────────────
  bookings: {
    list: <T = unknown>(queryString: string) =>
      apiClient.get<T>(`/developer/bookings?${queryString}`),

    refund: (bookingId: string) =>
      apiClient.post(`/developer/bookings/${bookingId}/refund`),
  },

  // ─── Venues ─────────────────────────────────────────────────────────────────
  venues: {
    list: <T = unknown>(params?: Record<string, string | number | boolean>) =>
      apiClient.get<T>('/developer/venues', { params }),

    create: <T = unknown>(data: unknown) =>
      apiClient.post<T>('/developer/venues', data),
  },

  // ─── Table Types ────────────────────────────────────────────────────────────
  tableTypes: {
    list: <T = unknown>() =>
      apiClient.get<T>('/developer/table-types'),

    update: (id: string, data: unknown) =>
      apiClient.put(`/developer/table-types/${id}`, data),
  },

  // ─── Settings ───────────────────────────────────────────────────────────────
  settings: {
    list: <T = unknown>() =>
      apiClient.get<T>('/developer/settings'),

    update: (key: string, value: string) =>
      apiClient.put('/developer/settings', { key, value }),

    refetch: <T = unknown>() =>
      apiClient.get<T>('/developer/settings'),
  },

  // ─── Users ──────────────────────────────────────────────────────────────────
  users: {
    list: <T = unknown>() =>
      apiClient.get<T>('/developer/users'),

    updateRole: (userId: string, role: string) =>
      apiClient.put(`/developer/users/${userId}/role`, { role }),
  },
};
