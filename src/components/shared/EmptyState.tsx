import { InboxOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';

interface Props {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ title = 'Nothing here yet', description, actionLabel, onAction }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 24px',
      gap: 12,
      textAlign: 'center',
    }}>
      <InboxOutlined style={{ fontSize: 48, color: 'var(--accent-violet)', opacity: 0.5 }} />
      <Typography.Title level={4} style={{ margin: 0 }}>{title}</Typography.Title>
      {description && <Typography.Text type="secondary">{description}</Typography.Text>}
      {actionLabel && onAction && (
        <Button type="primary" onClick={onAction} style={{ marginTop: 8, borderRadius: 99 }}>{actionLabel}</Button>
      )}
    </div>
  );
}
