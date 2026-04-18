import { BaseService } from './BaseService';
import type {
  EventSummary,
  EventDetail,
  EventFacets,
  EventTablesResponse,
  EventTicketTypesResponse,
} from '../types/event';
import type { PagedResponse } from '../types/shared';

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

export interface AdminEventListParams extends Record<string, unknown> {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  category?: string;
}

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

export class EventService extends BaseService {
  private static _instance: EventService | null = null;
  static getInstance(): EventService {
    return (this._instance ??= new EventService());
  }
  private constructor() {
    super('EventService');
  }

  // ── Public ──────────────────────────────────────
  list = (params?: EventListParams) =>
    this.get<PagedResponse<EventSummary>>('/events', { params });

  getById = (id: string) => this.get<EventDetail>(`/events/${id}`);

  getBySlug = (slug: string) => this.get<EventDetail>(`/events/by-slug/${slug}`);

  getFacets = () => this.get<EventFacets>('/events/facets');

  getTables = (id: string) => this.get<EventTablesResponse>(`/events/${id}/tables`);

  getSchemaOrg = (id: string) => this.get(`/events/${id}/schema`);

  getSeoMeta = (id: string) => this.get(`/events/${id}/seo`);

  getItemListSchema = () => this.get('/events/schema-list');

  getTicketTypes = (id: string) =>
    this.get<EventTicketTypesResponse>(`/events/${id}/ticket-types`);

  // ── Admin ───────────────────────────────────────
  adminList = (params?: AdminEventListParams) =>
    this.get<PagedResponse<EventDetail>>('/admin/events', { params });

  adminGetById = (id: string) => this.get<EventDetail>(`/admin/events/${id}`);

  create = (payload: CreateEventPayload) =>
    this.post<EventDetail>('/admin/events', payload);

  update = (id: string, payload: UpdateEventPayload) =>
    this.put<EventDetail>(`/admin/events/${id}`, payload);

  changeStatus = (id: string, status: string) =>
    this.put<EventDetail>(`/admin/events/${id}/status`, { status });

  remove = (id: string) => this.delete(`/admin/events/${id}`);

  duplicate = (id: string, startDate: string, endDate: string) =>
    this.post<EventDetail>(`/admin/events/${id}/duplicate`, { startDate, endDate });

  uploadImage = (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return this.post<{ imageUrl: string }>(`/admin/events/${id}/image`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  checkLayoutLocked = (id: string) =>
    this.get<{ locked: boolean }>(`/admin/events/${id}/layout-locked`);

  getStats = (id: string) => this.get<EventStats>(`/admin/events/${id}/stats`);
}

export const eventService = EventService.getInstance();
