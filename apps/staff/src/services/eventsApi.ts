import apiClient from '@code829/shared/lib/axios';
import type { EventSummary, EventDetail, EventFacets, EventTablesResponse } from '@code829/shared/types/event';
import type { PagedResponse } from '@code829/shared/types/shared';

export interface EventListParams {
  search?: string;
  category?: string;
  city?: string;
  dateFilter?: 'today' | 'this-week' | 'this-month';
  minPrice?: number;
  maxPrice?: number;
  venueId?: string;
  page?: number;
  pageSize?: number;
}

export const eventsApi = {
  list: (params?: EventListParams) =>
    apiClient.get<PagedResponse<EventSummary>>('/events', { params }),

  getById: (id: string) =>
    apiClient.get<EventDetail>(`/events/${id}`),

  getBySlug: (slug: string) =>
    apiClient.get<EventDetail>(`/events/by-slug/${slug}`),

  getFacets: () =>
    apiClient.get<EventFacets>('/events/facets'),

  getTables: (id: string) =>
    apiClient.get<EventTablesResponse>(`/events/${id}/tables`),

  getSchemaOrg: (id: string) =>
    apiClient.get(`/events/${id}/schema`),

  getSeoMeta: (id: string) =>
    apiClient.get(`/events/${id}/seo`),

  getItemListSchema: () =>
    apiClient.get('/events/schema-list'),
};
