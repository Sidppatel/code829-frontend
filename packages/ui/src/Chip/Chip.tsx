import React from 'react';
import './Chip.css';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  selected?: boolean;
  disabled?: boolean;
  onRemove?: () => void;
  leadingIcon?: React.ReactNode;
}

export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  { selected = false, disabled = false, onRemove, leadingIcon, className, children, onClick, ...rest },
  ref,
) {
  const interactive = Boolean(onClick) && !disabled;
  const classes = [
    'ui-chip',
    selected ? 'ui-chip--selected' : '',
    disabled ? 'ui-chip--disabled' : '',
    interactive ? 'ui-chip--interactive' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      ref={ref}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? selected : undefined}
      aria-disabled={disabled || undefined}
      className={classes}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e as unknown as React.MouseEvent<HTMLSpanElement>);
        }
      }}
      {...rest}
    >
      {leadingIcon && <span className="ui-chip__icon">{leadingIcon}</span>}
      <span className="ui-chip__label">{children}</span>
      {onRemove && !disabled && (
        <button
          type="button"
          className="ui-chip__remove"
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" fill="none">
            <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </span>
  );
});
