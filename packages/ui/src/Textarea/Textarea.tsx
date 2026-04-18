import React from 'react';
import './Textarea.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, fullWidth = true, id, className, rows = 4, ...rest },
  ref,
) {
  const textareaId = id ?? React.useId();
  const describedBy = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined;
  const wrapperClasses = [
    'ui-textarea',
    fullWidth ? 'ui-textarea--full' : '',
    error ? 'ui-textarea--error' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={textareaId} className="ui-textarea__label">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className="ui-textarea__control"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {error ? (
        <p id={`${textareaId}-error`} className="ui-textarea__error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${textareaId}-hint`} className="ui-textarea__hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
