import type { ReactElement, ReactNode } from 'react';
import { Form } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import type { Rule } from 'antd/es/form';

interface Props {
  name: NamePath;
  label: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  rules?: Rule[];
  dependencies?: NamePath[];
  valuePropName?: 'value' | 'checked';
  tooltip?: string;
  children: ReactElement;
}

export default function FormField({
  name,
  label,
  hint,
  required,
  rules,
  dependencies,
  valuePropName,
  tooltip,
  children,
}: Props) {
  const mergedRules: Rule[] | undefined = required
    ? [{ required: true, message: `${typeof label === 'string' ? label : 'This field'} is required` }, ...(rules ?? [])]
    : rules;

  return (
    <Form.Item
      name={name}
      label={label}
      required={required}
      rules={mergedRules}
      dependencies={dependencies}
      valuePropName={valuePropName}
      tooltip={tooltip}
      extra={hint}
    >
      {children}
    </Form.Item>
  );
}
