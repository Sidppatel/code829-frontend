import type { ReactNode } from 'react';
import DisplayHeading from './DisplayHeading';

interface Props {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  icon: ReactNode;
  meta: string;
}

export default function SeatingModeCard({
  active,
  disabled,
  onClick,
  title,
  subtitle,
  icon,
  meta,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 18,
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        background: active ? 'var(--primary-soft)' : 'var(--bg-soft)',
        outline: active ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
        outlineOffset: active ? -2 : -1,
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        opacity: disabled ? 0.55 : 1,
        transition: 'background 0.18s var(--ease-human), outline-color 0.18s var(--ease-human)',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-md)',
          flexShrink: 0,
          background: active ? 'var(--bg-surface)' : 'var(--bg-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <DisplayHeading as="div" size="sm">{title}</DisplayHeading>
          {active && (
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 99,
                background: 'var(--primary)',
                color: 'var(--text-on-brand)',
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              Selected
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
          {subtitle}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          {meta}
        </div>
      </div>
    </button>
  );
}

export function SeatingIconTables({ active }: { active: boolean }) {
  const c = active ? 'var(--primary)' : 'var(--text-muted)';
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="3.5" stroke={c} strokeWidth="1.6" />
      <circle cx="24" cy="8" r="3.5" stroke={c} strokeWidth="1.6" />
      <circle cx="8" cy="24" r="3.5" stroke={c} strokeWidth="1.6" />
      <circle cx="24" cy="24" r="3.5" stroke={c} strokeWidth="1.6" />
      <circle cx="16" cy="16" r="3.5" fill={c} opacity="0.25" />
      <circle cx="16" cy="16" r="3.5" stroke={c} strokeWidth="1.6" />
    </svg>
  );
}

export function SeatingIconOpen({ active }: { active: boolean }) {
  const c = active ? 'var(--primary)' : 'var(--text-muted)';
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="3" y="6" width="26" height="5" rx="1.5" stroke={c} strokeWidth="1.6" />
      <rect x="3" y="13.5" width="26" height="5" rx="1.5" stroke={c} strokeWidth="1.6" fill={c} fillOpacity="0.25" />
      <rect x="3" y="21" width="26" height="5" rx="1.5" stroke={c} strokeWidth="1.6" />
    </svg>
  );
}
