import type { ReactNode } from 'react';

export interface StepDef {
  key: string;
  label: ReactNode;
}

interface Props {
  steps: StepDef[];
  current: number;
  onSelect?: (index: number) => void;
}

export default function Stepper({ steps, current, onSelect }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        marginBottom: 24,
        borderBottom: '1px solid var(--border-subtle)',
        overflowX: 'auto',
      }}
    >
      {steps.map((s, i) => {
        const active = i === current;
        const done = i < current;
        const tone = active ? 'var(--primary)' : done ? 'var(--text-secondary)' : 'var(--text-muted)';
        return (
          <button
            type="button"
            key={s.key}
            onClick={() => onSelect?.(i)}
            style={{
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: onSelect ? 'pointer' : 'default',
              background: 'none',
              border: 'none',
              color: tone,
              borderBottom: `2px solid ${active ? 'var(--primary)' : 'transparent'}`,
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 18,
                height: 18,
                borderRadius: 99,
                fontSize: 10,
                marginRight: 8,
                background: done || active ? 'var(--primary)' : 'var(--bg-muted)',
                color: done || active ? 'var(--text-on-brand)' : 'var(--text-muted)',
                fontWeight: 700,
              }}
            >
              {done ? '✓' : i + 1}
            </span>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
