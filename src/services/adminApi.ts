import apiClient from '../lib/axios';

export const adminApi = {
  // ─── Dashboard ──────────────────────────────────────────────────────────────
  dashboard: {
    getNextEvent: <T = unknown>() =>
      apiClient.get<T>('/admin/dashboard/next-event'),

    getStats: <T = unknown>() =>
      apiClient.get<T>('/admin/dashboard'),
  },

  // ─── Events ─────────────────────────────────────────────────────────────────
  events: {
    list: <T = unknown>(params: Record<string, string | number | boolean>) =>
      apiClient.get<T>('/admin/events', { params }),

    getById: <T = unknown>(id: string) =>
      apiClient.get<T>(`/admin/events/${id}`),

    update: (id: string, payload: unknown) =>
      apiClient.put(`/admin/events/${id}`, payload),

    updateStatus: (id: string, status: string) =>
      apiClient.put(`/admin/events/${id}/status`, { status }),

    delete: (id: string) =>
      apiClient.delete(`/admin/events/${id}`),

    duplicate: (id: string, startDate: string, endDate: string) =>
      apiClient.post(`/admin/events/${id}/duplicate`, { startDate, endDate }),

    checkLayoutLocked: (id: string) =>
      apiClient.get<{ locked: boolean }>(`/admin/events/${id}/layout-locked`),

    getPaymentMethods: <T = unknown>(id: string) =>
      apiClient.get<T>(`/admin/events/${id}/payment-methods`),
  },

  // ─── Layout ─────────────────────────────────────────────────────────────────
  layout: {
    get: <T = unknown>(eventId: string) =>
      apiClient.get<T>(`/admin/events/${eventId}/layout`),

    getDraft: <T = unknown>(eventId: string) =>
      apiClient.get<T>(`/admin/events/${eventId}/layout/draft`),

    getStatus: <T = unknown>(eventId: string) =>
      apiClient.get<T>(`/admin/events/${eventId}/layout/status`),

    getLocked: <T = unknown>(eventId: string) =>
      apiClient.get<T>(`/admin/events/${eventId}/layout/locked`),

    saveDraft: (eventId: string, payload: unknown) =>
      apiClient.post(`/admin/events/${eventId}/layout/draft`, payload),

    save: (eventId: string, payload: unknown) =>
      apiClient.post(`/admin/events/${eventId}/layout`, payload),

    flush: (eventId: string) =>
      apiClient.post(`/admin/events/${eventId}/layout/flush`),
  },

  // ─── Pricing ────────────────────────────────────────────────────────────────
  pricing: {
    list: <T = unknown>(eventId: string) =>
      apiClient.get<T>(`/admin/events/${eventId}/pricing`),

    resolve: <T = unknown>(eventId: string) =>
      apiClient.get<T>(`/admin/events/${eventId}/pricing/resolve`),

    create: (eventId: string, payload: unknown) =>
      apiClient.post(`/admin/events/${eventId}/pricing`, payload),

    update: (eventId: string, ruleId: string, payload: unknown) =>
      apiClient.put(`/admin/events/${eventId}/pricing/${ruleId}`, payload),

    delete: (eventId: string, ruleId: string) =>
      apiClient.delete(`/admin/events/${eventId}/pricing/${ruleId}`),

    reorder: (eventId: string, payload: unknown) =>
      apiClient.put(`/admin/events/${eventId}/pricing/reorder`, payload),
  },

  // ─── Bookings ───────────────────────────────────────────────────────────────
  bookings: {
    list: <T = unknown>(queryString: string) =>
      apiClient.get<T>(`/admin/bookings?${queryString}`),

    getStats: <T = unknown>(eventId: string) =>
      apiClient.get<T>(`/admin/bookings/stats?eventId=${eventId}`),
  },

  // ─── Venues ─────────────────────────────────────────────────────────────────
  venues: {
    list: <T = unknown>(params?: Record<string, string | number | boolean>) =>
      apiClient.get<T>('/admin/venues', { params }),

    getById: <T = unknown>(id: string) =>
      apiClient.get<T>(`/admin/venues/${id}`),

    create: <T = unknown>(data: unknown) =>
      apiClient.post<T>('/admin/venues', data),

    update: (id: string, data: unknown) =>
      apiClient.put(`/admin/venues/${id}`, data),

    delete: (id: string) =>
      apiClient.delete(`/admin/venues/${id}`),
  },

  // ─── Table Types ────────────────────────────────────────────────────────────
  tableTypes: {
    list: <T = unknown>() =>
      apiClient.get<T>('/admin/table-types'),

    create: (data: unknown) =>
      apiClient.post('/admin/table-types', data),

    update: (id: string, data: unknown) =>
      apiClient.put(`/admin/table-types/${id}`, data),

    delete: (id: string) =>
      apiClient.delete(`/admin/table-types/${id}`),
  },
};
