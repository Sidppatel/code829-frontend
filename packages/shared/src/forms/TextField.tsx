import { createElement } from 'react';
import { Form, Input } from 'antd';
import type { InputProps } from 'antd';
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';

interface TextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  inputProps?: Omit<InputProps, 'value' | 'onChange' | 'onBlur'>;
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = 'text',
  required,
  disabled,
  autoComplete,
  inputProps,
}: TextFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });
  const Component = type === 'password' ? Input.Password : Input;
  return (
    <Form.Item
      label={label}
      required={required}
      validateStatus={fieldState.error ? 'error' : undefined}
      help={fieldState.error?.message}
    >
      {createElement(Component, {
        ...field,
        ...inputProps,
        type: type === 'password' ? undefined : type,
        placeholder,
        disabled,
        autoComplete,
        value: field.value ?? '',
      })}
    </Form.Item>
  );
}
