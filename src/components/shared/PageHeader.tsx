import { Typography, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

interface Props {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
  onBack?: () => void;
}

export default function PageHeader({ title, subtitle, extra, onBack }: Props) {
  return (
    <div style={{
      marginBottom: 24,
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    }}>
      <Space size={12} align="center" style={{ minWidth: 0 }}>
        {onBack && (
          <ArrowLeftOutlined
            onClick={onBack}
            style={{
              fontSize: 18,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'color 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-violet)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          />
        )}
        <Space orientation="vertical" size={0} style={{ minWidth: 0 }}>
          <Typography.Title level={2} style={{ margin: 0, whiteSpace: 'nowrap' }}>{title}</Typography.Title>
          {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
        </Space>
      </Space>
      {extra && <div style={{ flexShrink: 0 }}>{extra}</div>}
    </div>
  );
}
