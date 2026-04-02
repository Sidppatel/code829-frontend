import { Spin } from 'antd';

interface Props {
  fullPage?: boolean;
  description?: string;
}

export default function LoadingSpinner({ fullPage = true }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: fullPage ? '60vh' : '120px',
    }}>
      <Spin size="large" />
    </div>
  );
}
