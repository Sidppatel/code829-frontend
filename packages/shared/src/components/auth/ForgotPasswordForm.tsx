import { useState } from 'react';
import { Form, Input, Button, Typography, Card, App, Result } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { adminAuthApi } from '../../services/adminAuthApi';
import BrandLogo from '../shared/BrandLogo';

interface ForgotPasswordFormProps {
  title?: string;
  loginPath?: string;
}

export default function ForgotPasswordForm({
  title = 'Forgot Password',
  loginPath = '/login',
}: ForgotPasswordFormProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { message } = App.useApp();

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      await adminAuthApi.requestPasswordReset(values.email);
      setSent(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to send reset link';
      message.error(msg);
    } finally {
      setLoading(false);
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
            extra={<Link to={loginPath}>Back to sign in</Link>}
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

        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            name="email"
            rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Send Reset Link
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Link to={loginPath}>Back to sign in</Link>
        </div>
      </Card>
    </div>
  );
}
