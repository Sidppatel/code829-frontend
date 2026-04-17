import apiClient from '../lib/axios';
import type { EventDetail } from '../types/event';
import type { PagedResponse } from '../types/shared';

export interface AdminEventListParams extends Record<string, unknown> {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  category?: string;
}

/**
 * Input shape the backend Create/Update endpoints expect for a single ticket type.
 * Mirrors `NestedTicketType{Request,Update}` in `contracts/DTOs/Events`.
 * Note `name` / `capacity` — NOT `label` / `maxQuantity` (those are response-side names).
 */
export interface EventTicketTypeInput {
  id?: string;
  name: string;
  priceCents: number;
  capacity?: number;
  description?: string;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  category: string;
  startDate: string;
  endDate: string;
  venueId: string;
  isFeatured?: boolean;
  layoutMode: string;
  maxCapacity?: number;
  bannerImageUrl?: string;
  pricePerPersonCents?: number;
  ticketTypes?: EventTicketTypeInput[];
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  status?: string;
}

export interface EventStats {
  totalSold: number;
  maxCapacity: number;
  fillRatePct: number;
  grossRevenueCents: number;
}

export const adminEventsApi = {
  list: (params?: AdminEventListParams) =>
    apiClient.get<PagedResponse<EventDetail>>('/admin/events', { params }),

  getById: (id: string) =>
    apiClient.get<EventDetail>(`/admin/events/${id}`),

  create: (payload: CreateEventPayload) =>
    apiClient.post<EventDetail>('/admin/events', payload),

  update: (id: string, payload: UpdateEventPayload) =>
    apiClient.put<EventDetail>(`/admin/events/${id}`, payload),

  changeStatus: (id: string, status: string) =>
    apiClient.put<EventDetail>(`/admin/events/${id}/status`, { status }),

  delete: (id: string) =>
    apiClient.delete(`/admin/events/${id}`),

  duplicate: (id: string, startDate: string, endDate: string) =>
    apiClient.post<EventDetail>(`/admin/events/${id}/duplicate`, { startDate, endDate }),

  uploadImage: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post<{ imageUrl: string }>(`/admin/events/${id}/image`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  checkLayoutLocked: (id: string) =>
    apiClient.get<{ locked: boolean }>(`/admin/events/${id}/layout-locked`),

  getStats: (id: string) =>
    apiClient.get<EventStats>(`/admin/events/${id}/stats`),
};
