import { useState } from 'react';
import { Form, Button, Typography, Card, App, Result } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adminAuthApi } from '../../services/adminAuthApi';
import { TextField } from '../../forms/TextField';
import { applyApiFieldErrors } from '../../forms/applyApiFieldErrors';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../../schemas/authSchemas';
import BrandLogo from '../shared/BrandLogo';

interface ForgotPasswordFormProps {
  title?: string;
  loginPath?: string;
}

export default function ForgotPasswordForm({
  title = 'Forgot Password',
  loginPath = '/login',
}: ForgotPasswordFormProps) {
  const [sent, setSent] = useState(false);
  const { message } = App.useApp();
  const { control, handleSubmit, setError, formState: { isSubmitting } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    try {
      await adminAuthApi.requestPasswordReset(values.email);
      setSent(true);
    } catch (err) {
      const top = applyApiFieldErrors<ForgotPasswordInput>(err, setError);
      message.error(top ?? 'Failed to send reset link');
    }
  };

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Card style={{ maxWidth: 420, width: '100%' }}>
          <Result
            status="success"
            title="Check Your Email"
            subTitle="If an account exists with that email, we've sent a password reset link. Please check your inbox."
            extra={<Link to={loginPath}>{'Back to sign in'}</Link>}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Card style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <BrandLogo size="lg" />
          <Typography.Title level={3} style={{ marginTop: 16, marginBottom: 4 }}>
            {title}
          </Typography.Title>
          <Typography.Text type="secondary">
            Enter your email and we'll send you a reset link
          </Typography.Text>
        </div>

        <Form layout="vertical" onFinish={handleSubmit(onSubmit)} autoComplete="off">
          <TextField
            control={control}
            name="email"
            placeholder="Email"
            type="email"
            inputProps={{ prefix: <MailOutlined />, size: 'large' }}
          />
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isSubmitting} block size="large">
              Send Reset Link
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Link to={loginPath}>{'Back to sign in'}</Link>
        </div>
      </Card>
    </div>
  );
}
