import React from 'react';
import './Spinner.css';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  color?: string;
  label?: string;
}

const SIZE_PX: Record<SpinnerSize, number> = { xs: 12, sm: 16, md: 24, lg: 40 };

export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 'md', color, label = 'Loading', className, style, ...rest },
  ref,
) {
  const px = SIZE_PX[size];
  const classes = ['ui-spinner', `ui-spinner--${size}`, className ?? ''].filter(Boolean).join(' ');

  return (
    <span
      ref={ref}
      role="status"
      aria-label={label}
      className={classes}
      style={{ width: px, height: px, borderColor: color, borderRightColor: 'transparent', ...style }}
      {...rest}
    />
  );
});
