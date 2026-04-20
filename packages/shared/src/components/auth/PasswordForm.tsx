import { useState } from 'react';
import { Form, Input, Button, App } from 'antd';
import { LockOutlined } from '@ant-design/icons';

type Mode = 'change' | 'reset' | 'create';

interface Props {
  mode: Mode;
  onSubmit: (values: { currentPassword?: string; newPassword: string }) => Promise<void>;
  submitLabel?: string;
  showSuccessMessage?: boolean;
}

export default function PasswordForm({ mode, onSubmit, submitLabel = 'Submit', showSuccessMessage = true }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const onFinish = async (values: { currentPassword?: string; newPassword: string; confirmNewPassword: string }) => {
    setLoading(true);
    try {
      await onSubmit({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      if (showSuccessMessage) message.success('Password updated successfully');
      form.resetFields();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'An error occurred. Please try again.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
      {mode === 'change' && (
        <Form.Item
          name="currentPassword"
          rules={[{ required: true, message: 'Please enter your current password' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Current password" size="large" />
        </Form.Item>
      )}
      <Form.Item
        name="newPassword"
        rules={[{ required: true, min: 8, message: 'Password must be at least 8 characters' }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="New password" size="large" />
      </Form.Item>
      <Form.Item
        name="confirmNewPassword"
        dependencies={['newPassword']}
        rules={[
          { required: true, message: 'Please confirm your password' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Passwords do not match'));
            },
          }),
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" size="large" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block size="large" loading={loading}>
          {submitLabel}
        </Button>
      </Form.Item>
    </Form>
  );
}
