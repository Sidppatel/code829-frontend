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
  const isBalanced32 = items.length === 5 && cols === 3;

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isBalanced32 ? 'repeat(6, 1fr)' : `repeat(${cols}, minmax(0, 1fr))`,
    gap: 14,
    ...style,
  };

  const getItemStyle = (index: number): CSSProperties => {
    if (!isBalanced32) return {};
    return {
      gridColumn: index < 3 ? 'span 2' : 'span 3',
    };
  };

  if (variant === 'mini') {
    return (
      <div className={className} style={gridStyle}>
        {items.map((item, i) => (
          <div key={i} style={getItemStyle(i)}>
            <MiniStat label={item.label} value={item.value} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className} style={gridStyle}>
      {items.map((item, i) => (
        <div key={i} style={getItemStyle(i)}>
          <SoftCard>
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
                  fontSize: 'clamp(20px, 6vw, 28px)',
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
        </div>
      ))}
    </div>
  );
}
