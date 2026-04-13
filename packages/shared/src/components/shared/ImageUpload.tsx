import { useState, useCallback, useRef } from 'react';
import { App, Image as AntImage, Button, Popconfirm, Modal, Slider } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  ZoomInOutlined,
  ZoomOutOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import type { ImageDto } from '../../types/image';
import { imagesApi } from '../../services/imagesApi';

// ─── canvas helper (16:9, no circle clip) ────────────────────────────────────
async function getCroppedBlob(
  imageSrc: string,
  croppedArea: Area,
  outW = 1280,
  outH = 720,
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(
    image,
    croppedArea.x,
    croppedArea.y,
    croppedArea.width,
    croppedArea.height,
    0,
    0,
    outW,
    outH,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/webp',
      0.9,
    );
  });
}

// ─── types ────────────────────────────────────────────────────────────────────
interface ImageUploadProps {
  entityType: string;
  entityId: string | undefined;
  images: ImageDto[];
  onImagesChange: (images: ImageDto[]) => void;
  maxCount?: number;
  disabled?: boolean;
}

// ─── component ────────────────────────────────────────────────────────────────
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

  // crop modal state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const pendingFileName = useRef('image.webp');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── file selected → open crop modal ──────────────────────────────────────
  const handleFileSelect = (file: File) => {
    if (!entityId) {
      message.warning('Save the record first before uploading images');
      return;
    }
    pendingFileName.current = file.name;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCropSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    });
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  // ── confirmed crop → process → upload ────────────────────────────────────
  const handleConfirm = async () => {
    if (!cropSrc || !croppedArea || !entityId) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(cropSrc, croppedArea);
      const file = new File([blob], 'event-image.webp', { type: 'image/webp' });
      await imagesApi.upload(entityType, entityId, file);
      const { data } = await imagesApi.getByEntity(entityType, entityId);
      onImagesChange(data);
      setCropSrc(null);
      message.success('Image uploaded');
    } catch {
      message.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // ── delete & primary ──────────────────────────────────────────────────────
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
      onImagesChange(images.map((i) => ({ ...i, isPrimary: i.id === imageId })));
    } catch {
      message.error('Failed to set primary image');
    }
  };

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── image grid ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: images.length > 0 ? 12 : 0 }}>
        {images.map((img) => (
          <div
            key={img.id}
            style={{
              position: 'relative',
              width: 160,
              height: 90,                   // 16:9 thumbnail preview
              borderRadius: 10,
              overflow: 'hidden',
              border: img.isPrimary
                ? '2px solid var(--accent-violet, #7c3aed)'
                : '1px solid var(--border, rgba(255,255,255,0.1))',
            }}
          >
            <AntImage
              src={img.cardUrl || img.thumbnailUrl || img.url}
              alt={img.originalName ?? 'Image'}
              width={160}
              height={90}
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

      {/* ── upload trigger ───────────────────────────────────────────────── */}
      {!disabled && images.length < maxCount && (
        <>
          {/* Hidden native file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = '';
            }}
          />
          <Button
            icon={<PlusOutlined />}
            loading={uploading}
            disabled={!entityId}
            style={{ borderRadius: 8 }}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Button>
        </>
      )}

      {/* ── crop modal ───────────────────────────────────────────────────── */}
      <Modal
        open={!!cropSrc}
        onCancel={() => setCropSrc(null)}
        title="Crop event image"
        width={560}
        centered
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button icon={<CloseOutlined />} onClick={() => setCropSrc(null)} disabled={uploading}>
              Cancel
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={uploading}
              onClick={handleConfirm}
            >
              Apply & Upload
            </Button>
          </div>
        }
      >
        {cropSrc && (
          <div>
            {/* hint */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 12,
                fontSize: 12,
                color: 'var(--text-muted)',
              }}
            >
              <InfoCircleOutlined />
              Crop to 16:9 — fits the event card (180 px tall) and detail banner (up to 400 px tall).
              Output saved as 1280 × 720 WebP.
            </div>

            {/* cropper */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 280,
                background: '#111',
                borderRadius: 12,
                overflow: 'hidden',
                marginBottom: 20,
              }}
            >
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                cropShape="rect"
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: { borderRadius: 12 },
                  cropAreaStyle: {
                    border: '2px solid var(--accent-violet, #7c3aed)',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                  },
                }}
              />
            </div>

            {/* zoom slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ZoomOutOutlined style={{ color: 'var(--text-muted)', fontSize: 16 }} />
              <Slider
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={setZoom}
                style={{ flex: 1 }}
                tooltip={{ formatter: (v) => `${Math.round((v ?? 1) * 100)}%` }}
              />
              <ZoomInOutlined style={{ color: 'var(--text-muted)', fontSize: 16 }} />
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              Drag to reposition · Scroll or use slider to zoom
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
