import React from 'react';

interface HumanCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'glass' | 'elevated' | 'flat';
  hover?: boolean;
}

export default function HumanCard({
  children,
  title,
  subtitle,
  extra,
  onClick,
  className = '',
  style,
  variant = 'elevated',
  hover = true,
}: HumanCardProps) {
  const baseClass = variant === 'glass' ? 'glass-card' : 'human-card-base';
  const hoverClass = hover ? 'hover-lift' : '';
  
  return (
    <div
      onClick={onClick}
      className={`${baseClass} ${hoverClass} ${className} spring-up`}
      style={{
        ...style,
        cursor: onClick ? 'pointer' : 'default',
        padding: '24px',
        backgroundColor: variant === 'elevated' ? 'var(--bg-surface)' : 'transparent',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: variant === 'elevated' ? 'var(--card-shadow)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {(title || extra) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: subtitle ? 4 : 8 }}>
          <div>
            {title && (
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif" }}>
                {title}
              </div>
            )}
            {subtitle && (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 2 }}>
                {subtitle}
              </div>
            )}
          </div>
          {extra && <div style={{ flexShrink: 0 }}>{extra}</div>}
        </div>
      )}
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
