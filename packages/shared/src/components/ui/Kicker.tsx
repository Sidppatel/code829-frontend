import type { CSSProperties, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}

export default function Kicker({
  children,
  color = 'var(--primary-light)',
  style,
}: Props) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color,
        letterSpacing: 2.5,
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
