import type { CSSProperties, ReactNode } from 'react';

interface Props {
  label: ReactNode;
  value: ReactNode;
  tone?: 'default' | 'brand';
  style?: CSSProperties;
}

export default function MiniStat({ label, value, tone = 'default', style }: Props) {
  return (
    <div
      style={{
        padding: 14,
        background: tone === 'brand' ? 'var(--primary-soft)' : 'var(--bg-soft)',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${tone === 'brand' ? 'var(--primary-muted)' : 'var(--border-subtle)'}`,
        textAlign: 'center',
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginTop: 4,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
    </div>
  );
}
