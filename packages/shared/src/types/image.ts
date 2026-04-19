export interface ImageDto {
  imageId: string;
  entityType: string;
  entityId: string;
  url: string;
  thumbnailUrl: string;
  cardUrl: string;
  originalName?: string;
  sizeBytes: number;
  width: number;
  height: number;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface ImageUploadResponse {
  imageId: string;
  url: string;
  thumbnailUrl: string;
  cardUrl: string;
  isPrimary: boolean;
}
