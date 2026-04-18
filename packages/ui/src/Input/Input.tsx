import React from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leadingIcon, trailingIcon, fullWidth = true, id, className, ...rest },
  ref,
) {
  const inputId = id ?? React.useId();
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  const wrapperClasses = [
    'ui-field',
    fullWidth ? 'ui-field--full' : '',
    error ? 'ui-field--error' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={inputId} className="ui-field__label">
          {label}
        </label>
      )}
      <div className="ui-field__control">
        {leadingIcon && <span className="ui-field__icon ui-field__icon--leading">{leadingIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          className="ui-field__input"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {trailingIcon && <span className="ui-field__icon ui-field__icon--trailing">{trailingIcon}</span>}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="ui-field__error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="ui-field__hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
