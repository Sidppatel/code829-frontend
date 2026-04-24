import { Form, DatePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';

interface DateFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  showTime?: boolean;
}

export function DateField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  disabled,
  showTime,
}: DateFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <Form.Item
      label={label}
      required={required}
      validateStatus={fieldState.error ? 'error' : undefined}
      help={fieldState.error?.message}
    >
      <DatePicker
        value={field.value ? dayjs(field.value as string | Date) : null}
        onChange={(d: Dayjs | null) => field.onChange(d ? d.toISOString() : null)}
        onBlur={field.onBlur}
        disabled={disabled}
        showTime={showTime}
        style={{ width: '100%' }}
      />
    </Form.Item>
  );
}
