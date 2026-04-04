import { Spin } from 'antd';

interface Props {
  fullPage?: boolean;
  description?: string;
}

export default function LoadingSpinner({ fullPage = true }: Props) {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: fullPage ? '60vh' : '120px',
      }}
    >
      <Spin size="large" />
    </div>
  );
}
