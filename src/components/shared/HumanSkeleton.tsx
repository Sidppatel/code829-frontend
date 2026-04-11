import React from 'react';

interface HumanSkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
  count?: number;
}

export default function HumanSkeleton({
  width = '100%',
  height = '20px',
  circle = false,
  className = '',
  count = 1,
  direction = 'ltr',
  subline,
}: HumanSkeletonProps) {
  const Skeletons = Array.from({ length: count }).map((_, i) => (
    <div
      key={i}
      className={`human-skeleton ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: circle ? '50%' : 'var(--radius-sm)',
        background: 'linear-gradient(90deg, var(--bg-soft) 25%, var(--border) 50%, var(--bg-soft) 75%)',
        backgroundSize: '200% 100%',
        animation: `skeleton-loading-${direction} 1.5s infinite linear`,
        marginBottom: i < count - 1 ? '8px' : 0,
      }}
    />
  ));

  return (
    <div style={{ width: '100%' }}>
      {Skeletons}
      {subline && (
        <div style={{ 
          marginTop: 12, 
          fontSize: 12, 
          color: 'var(--text-muted)', 
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          {subline}
        </div>
      )}
      <style>{`
        @keyframes skeleton-loading-ltr {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes skeleton-loading-ttb {
          0% { background-position: 0 200%; }
          100% { background-position: 0 -200%; }
        }
      `}</style>
    </div>
  );
}

/* Add specialized CSS to index.css for the animation if needed, but HSL gradients usually work well */
/* Adding the keyframes style here for convenience, but ideally it should be in index.css */
const style = document.createElement('style');
style.textContent = `
  @keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
if (typeof document !== 'undefined') document.head.appendChild(style);
