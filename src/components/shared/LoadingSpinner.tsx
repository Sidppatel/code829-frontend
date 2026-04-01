import { Spin } from 'antd';

interface Props {
  description?: string;
}

export default function LoadingSpinner({ description = 'Loading...' }: Props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 48 }}>
      <Spin size="large" description={description}>
        <div style={{ padding: 50 }} />
      </Spin>
    </div>
  );
}
