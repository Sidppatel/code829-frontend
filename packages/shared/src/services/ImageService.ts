import { BaseService } from './BaseService';
import type { ImageDto, ImageUploadResponse } from '../types/image';

export class ImageService extends BaseService {
  private static _instance: ImageService | null = null;
  static getInstance(): ImageService {
    return (this._instance ??= new ImageService());
  }
  private constructor() {
    super('ImageService');
  }

  upload = (entityType: string, entityId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return this.post<ImageUploadResponse>('/admin/images/upload', fd, {
      params: { entityType, entityId },
      timeout: 60000,
    });
  };

  getByEntity = (entityType: string, entityId: string) =>
    this.get<ImageDto[]>('/admin/images', { params: { entityType, entityId } });

  remove = (id: string) => this.delete(`/admin/images/${id}`);

  setPrimary = (id: string) => this.patch(`/admin/images/${id}/primary`);

  reorder = (entityType: string, entityId: string, imageIds: string[]) =>
    this.patch('/admin/images/reorder', { imageIds }, { params: { entityType, entityId } });

  uploadAvatar = (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return this.post<ImageUploadResponse>('/auth/me/avatar', fd, { timeout: 60000 });
  };

  deleteAvatar = () => this.delete('/auth/me/avatar');

  uploadLogo = (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return this.post<ImageUploadResponse>('/developer/logo', fd, { timeout: 60000 });
  };

  getLogo = () => this.get<ImageDto>('/developer/logo');
}

export const imageService = ImageService.getInstance();
