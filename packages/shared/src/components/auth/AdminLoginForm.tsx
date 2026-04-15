import { useState } from 'react';
import { Form, Input, Button, Typography, App } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { adminAuthApi } from '../../services/adminAuthApi';
import BrandLogo from '../shared/BrandLogo';

interface AdminLoginFormProps {
  title?: string;
  forgotPasswordPath?: string;
}

export default function AdminLoginForm({ title = 'Sign In', forgotPasswordPath = '/forgot-password' }: AdminLoginFormProps) {
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { message } = App.useApp();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await adminAuthApi.login(values.email, values.password);
      setAuth(data.token, data.user);
      const returnUrl = searchParams.get('returnUrl') || '/';
      navigate(returnUrl, { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid email or password';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg-page)' }}>
      <div
        className="glass-card"
        style={{
          maxWidth: 420,
          width: '100%',
          padding: '48px 36px',
          borderRadius: 28,
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <BrandLogo size="lg" />
          <Typography.Title level={3} style={{ marginTop: 16, marginBottom: 8, fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
            {title}
          </Typography.Title>
          <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            Enter your credentials to continue
          </Typography.Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
            <Input
              prefix={<MailOutlined style={{ color: 'var(--text-muted)', marginRight: 8 }} />}
              placeholder="Email"
              size="large"
              style={{ height: 52, borderRadius: 14, background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border)', fontSize: 15 }}
            />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Please enter your password' }]}>
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--text-muted)', marginRight: 8 }} />}
              placeholder="Password"
              size="large"
              style={{ height: 52, borderRadius: 14, background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border)', fontSize: 15 }}
            />
          </Form.Item>
          <div style={{ textAlign: 'right', marginBottom: 16, marginTop: -8 }}>
            <Link to={forgotPasswordPath} style={{ fontSize: 13, color: 'var(--primary-light)' }}>Forgot password?</Link>
          </div>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                height: 54,
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 700,
                background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-rose))',
                border: 'none',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.25)',
              }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
