import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  dot?: string;
}

export default function Chip({ children, active, onClick, dot }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? 'var(--primary-soft)' : 'var(--bg-surface)',
        color: active ? 'var(--primary)' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-full)',
        padding: '6px 12px',
        fontSize: 12,
        fontWeight: 500,
        cursor: onClick ? 'pointer' : 'default',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.15s var(--ease-human)',
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: dot,
          }}
        />
      )}
      {children}
    </button>
  );
}
