import { useState } from 'react';
import { Upload, App, Image, Button, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import type { ImageDto } from '../../types/image';
import { imagesApi } from '../../services/api';

interface ImageUploadProps {
  entityType: string;
  entityId: string | undefined;
  images: ImageDto[];
  onImagesChange: (images: ImageDto[]) => void;
  maxCount?: number;
  disabled?: boolean;
}

export default function ImageUpload({
  entityType,
  entityId,
  images,
  onImagesChange,
  maxCount = 10,
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { message } = App.useApp();

  const handleUpload = async (file: File) => {
    if (!entityId) {
      message.warning('Save the record first before uploading images');
      return false;
    }
    setUploading(true);
    try {
      await imagesApi.upload(entityType, entityId, file);
      const { data } = await imagesApi.getByEntity(entityType, entityId);
      onImagesChange(data);
      message.success('Image uploaded');
    } catch {
      message.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleDelete = async (imageId: string) => {
    try {
      await imagesApi.delete(imageId);
      onImagesChange(images.filter((i) => i.id !== imageId));
      message.success('Image deleted');
    } catch {
      message.error('Failed to delete image');
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await imagesApi.setPrimary(imageId);
      onImagesChange(
        images.map((i) => ({ ...i, isPrimary: i.id === imageId })),
      );
    } catch {
      message.error('Failed to set primary image');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: images.length > 0 ? 12 : 0 }}>
        {images.map((img) => (
          <div
            key={img.id}
            style={{
              position: 'relative',
              width: 120,
              height: 120,
              borderRadius: 10,
              overflow: 'hidden',
              border: img.isPrimary
                ? '2px solid var(--accent-violet, #7c3aed)'
                : '1px solid var(--border, rgba(255,255,255,0.1))',
            }}
          >
            <Image
              src={img.thumbnailUrl || img.url}
              alt={img.originalName ?? 'Image'}
              width={120}
              height={120}
              style={{ objectFit: 'cover' }}
              preview={{ src: img.url }}
            />
            {!disabled && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 4,
                  padding: '4px',
                  background: 'rgba(0,0,0,0.6)',
                }}
              >
                <Button
                  type="text"
                  size="small"
                  icon={img.isPrimary ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                  onClick={() => handleSetPrimary(img.id)}
                  style={{ color: '#fff', fontSize: 12 }}
                  title="Set as primary"
                />
                <Popconfirm
                  title="Delete this image?"
                  onConfirm={() => handleDelete(img.id)}
                  okText="Delete"
                  cancelText="Cancel"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    style={{ color: '#ff4d4f', fontSize: 12 }}
                    title="Delete"
                  />
                </Popconfirm>
              </div>
            )}
            {img.isPrimary && (
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  fontSize: 10,
                  background: 'var(--accent-violet, #7c3aed)',
                  color: '#fff',
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontWeight: 600,
                }}
              >
                Primary
              </div>
            )}
          </div>
        ))}
      </div>

      {!disabled && images.length < maxCount && (
        <Upload
          accept="image/jpeg,image/png,image/webp"
          showUploadList={false}
          beforeUpload={(file) => handleUpload(file as unknown as File)}
          disabled={uploading || !entityId}
        >
          <Button
            icon={<PlusOutlined />}
            loading={uploading}
            disabled={!entityId}
            style={{ borderRadius: 8 }}
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Button>
        </Upload>
      )}
    </div>
  );
}
