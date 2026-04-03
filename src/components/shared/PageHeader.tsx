import { Typography, Space } from 'antd';

interface Props {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, extra }: Props) {
  return (
    <div style={{
      marginBottom: 24,
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    }}>
      <Space direction="vertical" size={0} style={{ minWidth: 0 }}>
        <Typography.Title level={2} style={{ margin: 0, whiteSpace: 'nowrap' }}>{title}</Typography.Title>
        {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
      </Space>
      {extra && <div style={{ flexShrink: 0 }}>{extra}</div>}
    </div>
  );
}
