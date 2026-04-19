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
    const base =
      entityType === 'event'
        ? `/admin/events/${entityId}/images`
        : entityType === 'venue'
          ? `/admin/venues/${entityId}/images`
          : `/admin/images/upload?entityType=${entityType}&entityId=${entityId}`;
    return this.post<ImageUploadResponse>(base, fd, {
      timeout: 60000,
      headers: { 'Content-Type': undefined },
    });
  };

  uploadMany = async (entityType: string, entityId: string, files: File[]) => {
    const results: ImageUploadResponse[] = [];
    for (const file of files) {
      const { data } = await this.upload(entityType, entityId, file);
      results.push(data);
    }
    return results;
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
    return this.post<ImageUploadResponse>('/auth/me/avatar', fd, { timeout: 60000, headers: { 'Content-Type': undefined } });
  };

  deleteAvatar = () => this.delete('/auth/me/avatar');

  uploadLogo = (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return this.post<ImageUploadResponse>('/developer/logo', fd, { timeout: 60000, headers: { 'Content-Type': undefined } });
  };

  getLogo = () => this.get<ImageDto>('/developer/logo');
}

export const imageService = ImageService.getInstance();
