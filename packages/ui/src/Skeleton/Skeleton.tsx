import React from 'react';
import './Skeleton.css';

export type SkeletonShape = 'rect' | 'text' | 'circle';

export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  shape?: SkeletonShape;
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton = React.forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(
  { shape = 'rect', width, height, lines = 1, className, style, ...rest },
  ref,
) {
  if (shape === 'text' && lines > 1) {
    return (
      <span
        ref={ref}
        className={`ui-skel__stack ${className ?? ''}`}
        style={{ width, ...style }}
        {...rest}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <span
            key={i}
            className="ui-skel ui-skel--text"
            style={{ width: i === lines - 1 ? '70%' : '100%' }}
          />
        ))}
      </span>
    );
  }

  return (
    <span
      ref={ref}
      className={`ui-skel ui-skel--${shape} ${className ?? ''}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...rest}
    />
  );
});
