import apiClient from '../lib/axios';
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

export const adminVenuesApi = {
  list: (page = 1, pageSize = 20) =>
    apiClient.get<PagedResponse<Venue>>('/admin/venues', { params: { page, pageSize } }),

  getById: (id: string) =>
    apiClient.get<Venue>(`/admin/venues/${id}`),

  create: (payload: CreateVenuePayload) =>
    apiClient.post<Venue>('/admin/venues', payload),

  update: (id: string, payload: Partial<CreateVenuePayload> & { isActive?: boolean }) =>
    apiClient.put<Venue>(`/admin/venues/${id}`, payload),

  delete: (id: string) =>
    apiClient.delete(`/admin/venues/${id}`),

  uploadImage: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post<{ imageUrl: string }>(`/admin/venues/${id}/image`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
