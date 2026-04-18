import React from 'react';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, placeholder, fullWidth = true, id, className, ...rest },
  ref,
) {
  const selectId = id ?? React.useId();
  const describedBy = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;
  const wrapperClasses = [
    'ui-select',
    fullWidth ? 'ui-select--full' : '',
    error ? 'ui-select--error' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={selectId} className="ui-select__label">
          {label}
        </label>
      )}
      <div className="ui-select__control">
        <select
          ref={ref}
          id={selectId}
          className="ui-select__native"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="ui-select__caret" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      {error ? (
        <p id={`${selectId}-error`} className="ui-select__error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${selectId}-hint`} className="ui-select__hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
