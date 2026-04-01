import { Spin } from 'antd';

interface Props {
  tip?: string;
}

export default function LoadingSpinner({ tip = 'Loading...' }: Props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 48 }}>
      <Spin size="large" tip={tip}>
        <div style={{ padding: 50 }} />
      </Spin>
    </div>
  );
}
