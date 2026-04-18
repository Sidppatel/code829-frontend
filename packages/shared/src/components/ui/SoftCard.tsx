import type { CSSProperties, ReactNode, MouseEvent } from 'react';

interface Props {
  children: ReactNode;
  tone?: 'surface' | 'soft' | 'elevated';
  padding?: number | string;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  style?: CSSProperties;
  className?: string;
  hoverable?: boolean;
}

const TONE_BG: Record<NonNullable<Props['tone']>, string> = {
  surface: 'var(--bg-surface)',
  soft: 'var(--bg-soft)',
  elevated: 'var(--bg-elevated)',
};

export default function SoftCard({
  children,
  tone = 'surface',
  padding = 20,
  onClick,
  style,
  className,
  hoverable,
}: Props) {
  return (
    <div
      onClick={onClick}
      className={`${hoverable ? 'c829-card-hover' : ''}${className ? ' ' + className : ''}`.trim()}
      style={{
        background: TONE_BG[tone],
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding,
        boxShadow: 'var(--shadow-sm)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
