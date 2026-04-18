import React from 'react';
import './Badge.css';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeVariant = 'solid' | 'soft' | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = 'neutral', variant = 'soft', size = 'md', className, children, ...rest },
  ref,
) {
  const classes = [
    'ui-badge',
    `ui-badge--${tone}`,
    `ui-badge--${variant}`,
    `ui-badge--${size}`,
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span ref={ref} className={classes} {...rest}>
      {children}
    </span>
  );
});
