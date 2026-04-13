import apiClient from '../lib/axios';
import type { ImageDto, ImageUploadResponse } from '../types/image';

export const imagesApi = {
  upload: (entityType: string, entityId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post<ImageUploadResponse>('/admin/images/upload', fd, {
      params: { entityType, entityId },
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
  },

  getByEntity: (entityType: string, entityId: string) =>
    apiClient.get<ImageDto[]>('/admin/images', { params: { entityType, entityId } }),

  delete: (id: string) =>
    apiClient.delete(`/admin/images/${id}`),

  setPrimary: (id: string) =>
    apiClient.patch(`/admin/images/${id}/primary`),

  reorder: (entityType: string, entityId: string, imageIds: string[]) =>
    apiClient.patch('/admin/images/reorder', { imageIds }, { params: { entityType, entityId } }),

  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post<ImageUploadResponse>('/auth/me/avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
  },

  deleteAvatar: () =>
    apiClient.delete('/auth/me/avatar'),

  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post<ImageUploadResponse>('/developer/logo', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
  },

  getLogo: () =>
    apiClient.get<ImageDto>('/developer/logo'),
};
