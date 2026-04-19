import { Button, Modal, Spin } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

interface Props {
  open: boolean;
  onClose: () => void;
  qrUrl: string | null;
  loading?: boolean;
  title?: string;
  caption?: string;
  downloadFileName?: string;
  manualCode?: string;
}

export default function QrModal({
  open,
  onClose,
  qrUrl,
  loading,
  title = 'Ticket QR',
  caption,
  downloadFileName = 'ticket.png',
  manualCode,
}: Props) {
  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Modal open={open} onCancel={onClose} footer={null} title={title} centered destroyOnHidden>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          padding: '12px 0',
        }}
      >
        {loading || !qrUrl ? (
          <div style={{ minHeight: 260, display: 'flex', alignItems: 'center' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <img
              src={qrUrl}
              alt="Ticket QR Code"
              style={{
                width: 260,
                height: 260,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                padding: 14,
                border: '1px solid var(--border-subtle)',
              }}
            />
            {caption && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 320 }}>
                {caption}
              </div>
            )}
            {manualCode && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>
                  Can't scan? Enter code
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: 1,
                  padding: '6px 14px',
                  background: 'var(--bg-soft)',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  userSelect: 'all',
                }}>
                  {manualCode}
                </div>
              </div>
            )}
            <Button icon={<DownloadOutlined />} onClick={handleDownload}>
              Download
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
