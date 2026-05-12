import { BaseService } from './BaseService';
import type {
  Performer,
  EventPerformer,
  CreatePerformerPayload,
  UpdatePerformerPayload,
  SetEventPerformersPayload,
} from '../types/performer';
import type { PagedResponse } from '../types/shared';

export class PerformerService extends BaseService {
  private static _instance: PerformerService | null = null;
  static getInstance(): PerformerService {
    return (this._instance ??= new PerformerService());
  }
  private constructor() {
    super('PerformerService');
  }

  listPublic = (q?: string, page = 1, pageSize = 20) =>
    this.get<PagedResponse<Performer>>('/performers', { params: { q, page, pageSize } });

  getPublicBySlug = (slug: string) => this.get<Performer>(`/performers/${slug}`);

  getPublicEvents = (slug: string, status: 'upcoming' | 'past' = 'upcoming', page = 1, pageSize = 20) =>
    this.get(`/performers/${slug}/events`, { params: { status, page, pageSize } });

  listAdmin = (q?: string, page = 1, pageSize = 20) =>
    this.get<PagedResponse<Performer>>('/admin/performers', { params: { q, page, pageSize } });

  getAdminById = (id: string) => this.get<Performer>(`/admin/performers/${id}`);

  create = (payload: CreatePerformerPayload) =>
    this.post<Performer>('/admin/performers', payload);

  update = (id: string, payload: UpdatePerformerPayload) =>
    this.put<Performer>(`/admin/performers/${id}`, payload);

  remove = (id: string) => this.delete(`/admin/performers/${id}`);

  uploadImage = (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return this.post<Performer>(`/admin/performers/${id}/image`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  getEventLineup = (eventId: string) =>
    this.get<EventPerformer[]>(`/admin/events/${eventId}/performers`);

  setEventLineup = (eventId: string, payload: SetEventPerformersPayload) =>
    this.put<EventPerformer[]>(`/admin/events/${eventId}/performers`, payload);
}

export const performerService = PerformerService.getInstance();
