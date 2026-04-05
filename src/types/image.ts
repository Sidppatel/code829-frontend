export interface ImageDto {
  id: string;
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
  id: string;
  url: string;
  thumbnailUrl: string;
  cardUrl: string;
  isPrimary: boolean;
}
