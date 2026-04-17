import { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, App } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { adminAuthApi } from '../../services/adminAuthApi';
import { safeReturnUrl } from '../../lib/safeRedirect';
import BrandLogo from '../shared/BrandLogo';

interface AdminLoginFormProps {
  title?: string;
  forgotPasswordPath?: string;
}

export default function AdminLoginForm({ title = 'Sign In', forgotPasswordPath = '/forgot-password' }: AdminLoginFormProps) {
  const [loading, setLoading] = useState(false);
  const { setAuth, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { message } = App.useApp();

  // Handle insufficient role redirect — clear stale session and show error
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'insufficient_role') {
      logout();
      message.error('Access denied — your account does not have permission for this portal');
      // Clean up URL so the error doesn't re-trigger on refresh
      searchParams.delete('error');
      setSearchParams(searchParams, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await adminAuthApi.login(values.email, values.password);
      setAuth(data.token, data.user);
      navigate(safeReturnUrl(searchParams.get('returnUrl')), { replace: true });
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
              style={{ height: 52, borderRadius: 14, background: 'var(--bg-soft)', border: '1px solid var(--border)', fontSize: 15 }}
            />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Please enter your password' }]}>
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--text-muted)', marginRight: 8 }} />}
              placeholder="Password"
              size="large"
              style={{ height: 52, borderRadius: 14, background: 'var(--bg-soft)', border: '1px solid var(--border)', fontSize: 15 }}
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
                background: 'var(--primary)',
                border: 'none',
                boxShadow: 'var(--shadow-hover)',
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
