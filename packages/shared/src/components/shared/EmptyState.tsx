import { InboxOutlined } from '@ant-design/icons';
import { Button } from 'antd';

interface Props {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ title = 'Nothing here yet', description, actionLabel, onAction }: Props) {
  return (
    <div className="human-noise" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 24px',
      gap: 16,
      textAlign: 'center',
      background: 'var(--primary-tint)',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--border)',
      maxWidth: 600,
      margin: '0 auto',
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-md)',
        marginBottom: 8
      }}>
        <InboxOutlined style={{ fontSize: 32, color: 'var(--primary)', opacity: 0.8 }} />
      </div>
      <div style={{ maxWidth: 400 }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          fontFamily: "'Playfair Display', serif", 
          fontSize: 24, 
          fontWeight: 700,
          color: 'var(--text-primary)'
        }}>
          {title}
        </h3>
        {description && (
          <p style={{ 
            fontSize: 14, 
            color: 'var(--text-secondary)',
            fontWeight: 500,
            lineHeight: 1.6,
            margin: 0
          }}>
            {description}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button 
          type="primary" 
          onClick={onAction} 
          style={{ 
            marginTop: 12, 
            borderRadius: 'var(--radius-full)',
            height: 48,
            padding: '0 32px',
            fontWeight: 600,
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
