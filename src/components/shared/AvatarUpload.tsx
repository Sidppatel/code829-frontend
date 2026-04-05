import { useState } from 'react';
import { Upload, Avatar, App, Button, Popconfirm } from 'antd';
import { CameraOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
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
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(currentUrl);
  const { message } = App.useApp();

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const newUrl = await onUpload(file);
      if (newUrl) setUrl(newUrl);
    } catch {
      message.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      await onDelete();
      setUrl(null);
      message.success('Image removed');
    } catch {
      message.error('Failed to remove image');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
      <Avatar
        src={url}
        icon={!url ? <UserOutlined /> : undefined}
        size={size}
        shape={shape}
        style={{
          background: url ? undefined : 'var(--accent-violet, #7c3aed)',
          border: '2px solid var(--border, rgba(255,255,255,0.1))',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Upload
          accept="image/jpeg,image/png,image/webp"
          showUploadList={false}
          beforeUpload={(file) => handleUpload(file as unknown as File)}
          disabled={uploading}
        >
          <Button
            icon={<CameraOutlined />}
            loading={uploading}
            size="small"
            style={{ borderRadius: 8 }}
          >
            {url ? 'Change' : 'Upload'}
          </Button>
        </Upload>
        {url && onDelete && (
          <Popconfirm title="Remove image?" onConfirm={handleDelete} okText="Remove" cancelText="Cancel">
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              style={{ borderRadius: 8 }}
            >
              Remove
            </Button>
          </Popconfirm>
        )}
      </div>
    </div>
  );
}
