import { BaseService } from './BaseService';
import type {
  Sponsor,
  EventSponsor,
  CreateSponsorPayload,
  UpdateSponsorPayload,
  SetEventSponsorsPayload,
} from '../types/sponsor';
import type { PagedResponse } from '../types/shared';

export class SponsorService extends BaseService {
  private static _instance: SponsorService | null = null;
  static getInstance(): SponsorService {
    return (this._instance ??= new SponsorService());
  }
  private constructor() {
    super('SponsorService');
  }

  listPublic = (q?: string, page = 1, pageSize = 20) =>
    this.get<PagedResponse<Sponsor>>('/sponsors', { params: { q, page, pageSize } });

  getPublicBySlug = (slug: string) => this.get<Sponsor>(`/sponsors/${slug}`);

  getPublicEvents = (slug: string, status: 'upcoming' | 'past' = 'upcoming', page = 1, pageSize = 20) =>
    this.get(`/sponsors/${slug}/events`, { params: { status, page, pageSize } });

  listAdmin = (q?: string, page = 1, pageSize = 20) =>
    this.get<PagedResponse<Sponsor>>('/admin/sponsors', { params: { q, page, pageSize } });

  getAdminById = (id: string) => this.get<Sponsor>(`/admin/sponsors/${id}`);

  checkSlug = (slug: string, excludeId?: string) =>
    this.get<{ available: boolean; suggested: string }>('/admin/sponsors/slug-check', {
      params: { slug, excludeId },
    });

  create = (payload: CreateSponsorPayload) =>
    this.post<Sponsor>('/admin/sponsors', payload);

  update = (id: string, payload: UpdateSponsorPayload) =>
    this.put<Sponsor>(`/admin/sponsors/${id}`, payload);

  remove = (id: string) => this.delete(`/admin/sponsors/${id}`);

  uploadImage = (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return this.post<Sponsor>(`/admin/sponsors/${id}/image`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  getEventSponsors = (eventId: string) =>
    this.get<EventSponsor[]>(`/admin/events/${eventId}/sponsors`);

  setEventSponsors = (eventId: string, payload: SetEventSponsorsPayload) =>
    this.put<EventSponsor[]>(`/admin/events/${eventId}/sponsors`, payload);
}

export const sponsorService = SponsorService.getInstance();
