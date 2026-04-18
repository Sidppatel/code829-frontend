import React from 'react';
import './StatusPill.css';

export type StatusPillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusPillTone;
  pulse?: boolean;
  label: React.ReactNode;
}

export const StatusPill = React.forwardRef<HTMLSpanElement, StatusPillProps>(function StatusPill(
  { tone = 'neutral', pulse = false, label, className, ...rest },
  ref,
) {
  const classes = ['ui-status-pill', `ui-status-pill--${tone}`, className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <span ref={ref} className={classes} {...rest}>
      <span className={`ui-status-pill__dot${pulse ? ' ui-status-pill__dot--pulse' : ''}`} aria-hidden="true" />
      <span className="ui-status-pill__label">{label}</span>
    </span>
  );
});
