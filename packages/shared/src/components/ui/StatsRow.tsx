import type { CSSProperties, ReactNode } from 'react';
import MiniStat from './MiniStat';
import SoftCard from './SoftCard';

export interface StatsCell {
  label: ReactNode;
  value: ReactNode;
  trend?: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  icon?: ReactNode;
}

interface Props {
  items: StatsCell[];
  columns?: 2 | 3 | 4;
  variant?: 'kpi' | 'mini';
  style?: CSSProperties;
  className?: string;
}

const TREND_COLOR: Record<NonNullable<StatsCell['tone']>, string> = {
  neutral: 'var(--text-muted)',
  success: 'var(--status-success)',
  warning: 'var(--status-warning)',
  danger: 'var(--status-danger)',
};

function clampCols(n: number): 2 | 3 | 4 {
  if (n <= 2) return 2;
  if (n === 3) return 3;
  return 4;
}

export default function StatsRow({ items, columns, variant = 'mini', style, className }: Props) {
  const cols = columns ?? clampCols(items.length);

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gap: 14,
    ...style,
  };

  if (variant === 'mini') {
    return (
      <div className={className} style={gridStyle}>
        {items.map((item, i) => (
          <MiniStat key={i} label={item.label} value={item.value} />
        ))}
      </div>
    );
  }

  return (
    <div className={className} style={gridStyle}>
      {items.map((item, i) => (
        <SoftCard key={i}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.1,
                }}
              >
                {item.value}
              </div>
              {item.trend && (
                <div
                  style={{
                    fontSize: 12,
                    color: TREND_COLOR[item.tone ?? 'neutral'],
                    marginTop: 6,
                    fontWeight: 600,
                  }}
                >
                  {item.trend}
                </div>
              )}
            </div>
            {item.icon && (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-soft)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
            )}
          </div>
        </SoftCard>
      ))}
    </div>
  );
}
