import { Form, Select } from 'antd';
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  required,
  disabled,
  allowClear,
}: SelectFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <Form.Item
      label={label}
      required={required}
      validateStatus={fieldState.error ? 'error' : undefined}
      help={fieldState.error?.message}
    >
      <Select
        {...field}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        allowClear={allowClear}
      />
    </Form.Item>
  );
}
