import { BaseService } from './BaseService';
import type { Venue } from '../types/venue';
import type { PagedResponse } from '../types/shared';

export interface CreateVenuePayload {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export class VenueService extends BaseService {
  private static _instance: VenueService | null = null;
  static getInstance(): VenueService {
    return (this._instance ??= new VenueService());
  }
  private constructor() {
    super('VenueService');
  }

  list = (page = 1, pageSize = 20) =>
    this.get<PagedResponse<Venue>>('/admin/venues', { params: { page, pageSize } });

  getById = (id: string) => this.get<Venue>(`/admin/venues/${id}`);

  create = (payload: CreateVenuePayload) =>
    this.post<Venue>('/admin/venues', payload);

  update = (id: string, payload: Partial<CreateVenuePayload> & { isActive?: boolean }) =>
    this.put<Venue>(`/admin/venues/${id}`, payload);

  remove = (id: string) => this.delete(`/admin/venues/${id}`);

  uploadImage = (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return this.post<{ imageUrl: string }>(`/admin/venues/${id}/image`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };
}

export const venueService = VenueService.getInstance();
