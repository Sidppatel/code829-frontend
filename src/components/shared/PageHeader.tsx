import { Typography, Space } from 'antd';

interface Props {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, extra }: Props) {
  return (
    <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Space direction="vertical" size={0}>
        <Typography.Title level={2} style={{ margin: 0 }}>{title}</Typography.Title>
        {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
      </Space>
      {extra && <div>{extra}</div>}
    </div>
  );
}
