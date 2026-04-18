import type { CSSProperties, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  padding?: string | number;
  style?: CSSProperties;
}

export default function EmptyPanel({ children, padding = '28px 20px', style }: Props) {
  return (
    <div
      style={{
        padding,
        textAlign: 'center',
        background: 'var(--bg-soft)',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--border)',
        color: 'var(--text-muted)',
        fontSize: 13,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
