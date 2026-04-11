import { Spin } from 'antd';
import HumanSkeleton from './HumanSkeleton';

interface Props {
  fullPage?: boolean;
  skeleton?: 'card' | 'list' | 'text' | 'hero';
}

export default function LoadingSpinner({ fullPage = true, skeleton }: Props) {
  if (skeleton === 'hero') {
    return (
      <div style={{ padding: 24 }}>
        <HumanSkeleton height={300} className="spring-up" />
      </div>
    );
  }

  if (skeleton === 'card') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24, padding: 24 }}>
        <HumanSkeleton height={200} count={3} />
      </div>
    );
  }

  if (skeleton === 'list') {
    return (
      <div style={{ padding: 24 }}>
        <HumanSkeleton height={60} count={5} />
      </div>
    );
  }

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
