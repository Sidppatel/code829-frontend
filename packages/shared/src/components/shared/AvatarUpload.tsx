import { useState, useCallback, useRef } from 'react';
import { Upload, Avatar, App, Button, Popconfirm, Modal, Slider } from 'antd';
import {
  CameraOutlined,
  DeleteOutlined,
  UserOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';

// ─── canvas helper ───────────────────────────────────────────────────────────
async function getCroppedBlob(
  imageSrc: string,
  croppedArea: Area,
  outputSize = 400,
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d')!;

  // Clip to circle
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    image,
    croppedArea.x,
    croppedArea.y,
    croppedArea.width,
    croppedArea.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/webp', 0.9);
  });
}

// ─── component ───────────────────────────────────────────────────────────────
interface AvatarUploadProps {
  currentUrl?: string | null;
  onUpload: (file: File) => Promise<string | undefined>;
  onDelete?: () => Promise<void>;
  size?: number;
  shape?: 'circle' | 'square';
}

export default function AvatarUpload({
  currentUrl,
  onUpload,
  onDelete,
  size = 100,
  shape = 'circle',
}: AvatarUploadProps) {
  const { message } = App.useApp();

  // displayed URL (after confirmed upload)
  const [url, setUrl] = useState(currentUrl);

  // crop modal state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);

  const originalFileName = useRef('avatar.webp');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Called when user picks a file
  const handleFileSelect = (file: File) => {
    originalFileName.current = file.name;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCropSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    });
    reader.readAsDataURL(file);
    return false; // prevent antd auto-upload
  };

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  // User confirms the crop
  const handleConfirm = async () => {
    if (!cropSrc || !croppedArea) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(cropSrc, croppedArea);
      const file = new File([blob], 'avatar.webp', { type: 'image/webp' });
      const newUrl = await onUpload(file);
      if (newUrl) setUrl(newUrl);
      setCropSrc(null);
      message.success('Profile picture updated');
    } catch {
      message.error('Failed to upload picture');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      await onDelete();
      setUrl(null);
      message.success('Profile picture removed');
    } catch {
      message.error('Failed to remove picture');
    }
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        {/* Avatar preview */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Avatar
            src={url}
            icon={!url ? <UserOutlined /> : undefined}
            size={size}
            shape={shape}
            style={{
              background: url ? undefined : 'var(--primary)',
              border: '3px solid var(--border)',
              display: 'block',
            }}
          />
          {/* Hidden file input — triggered by the overlay click */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = '';          // reset so same file can be re-selected
            }}
          />

          {/* Camera overlay — direct child of the relative container so inset:0 works */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: shape === 'circle' ? '50%' : 10,
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-overlay)';
              const icon = e.currentTarget.querySelector('span') as HTMLElement | null;
              if (icon) icon.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              const icon = e.currentTarget.querySelector('span') as HTMLElement | null;
              if (icon) icon.style.opacity = '0';
            }}
          >
            <CameraOutlined
              style={{
                color: 'var(--text-on-brand)',
                fontSize: size * 0.28,
                opacity: 0,
                transition: 'opacity 0.2s',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Side buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Upload
            accept="image/jpeg,image/png,image/webp,image/gif"
            showUploadList={false}
            beforeUpload={(f) => handleFileSelect(f as unknown as File)}
          >
            <Button icon={<CameraOutlined />} size="small" style={{ borderRadius: 8 }}>
              {url ? 'Change photo' : 'Upload photo'}
            </Button>
          </Upload>

          {url && onDelete && (
            <Popconfirm
              title="Remove profile picture?"
              description="Your avatar will be cleared."
              onConfirm={handleDelete}
              okText="Remove"
              cancelText="Cancel"
            >
              <Button icon={<DeleteOutlined />} size="small" danger style={{ borderRadius: 8 }}>
                Remove
              </Button>
            </Popconfirm>
          )}

          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            JPG, PNG or WebP · max 10 MB
          </div>
        </div>
      </div>

      {/* ── Crop Modal ─────────────────────────────────────────────────────── */}
      <Modal
        open={!!cropSrc}
        onCancel={() => setCropSrc(null)}
        title="Crop your photo"
        width={480}
        centered
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              icon={<CloseOutlined />}
              onClick={() => setCropSrc(null)}
              disabled={uploading}
            >
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
            {/* Cropper area */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 340,
                background: 'var(--bg-elevated)',
                borderRadius: 12,
                overflow: 'hidden',
                marginBottom: 20,
              }}
            >
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape={shape === 'circle' ? 'round' : 'rect'}
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: { borderRadius: 12 },
                  cropAreaStyle: {
                    border: '2px solid var(--primary)',
                    boxShadow: '0 0 0 9999px var(--bg-overlay)',
                  },
                }}
              />
            </div>

            {/* Zoom slider */}
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

            <div style={{
              marginTop: 10,
              fontSize: 12,
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}>
              Drag to reposition · Scroll or use slider to zoom
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
