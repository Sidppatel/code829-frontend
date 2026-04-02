import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, App } from 'antd';
import { MailOutlined, LoginOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import ThemeToggle from '../../components/shared/ThemeToggle';

export default function LoginPage() {
  const [form] = Form.useForm();
  const [devForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleMagicLink = async (values: { email: string }) => {
    setLoading(true);
    try {
      await authApi.requestMagicLink(values.email);
      setMagicLinkSent(true);
      message.success('Check your email for the login link');
    } catch {
      message.error('Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async (values: { email: string }) => {
    setLoading(true);
    try {
      const { data } = await authApi.devLogin(values.email);
      setAuth(data.token, data.user);
      message.success(`Logged in as ${data.user.firstName}`);
      navigate('/');
    } catch {
      message.error('Dev login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero-section" style={{ minHeight: 'calc(100vh - 60px)', padding: '40px 16px' }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}
      >
        <div
          className="glass-card"
          style={{
            padding: '32px 24px',
            borderRadius: 20,
            position: 'relative',
          }}
        >
          {/* Theme toggle top-right */}
          <div style={{ position: 'absolute', top: 12, right: 12 }}>
            <ThemeToggle size="small" />
          </div>

          {/* Branding */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 32, color: 'var(--accent-violet)', marginBottom: 8 }}>✦</div>
            <div className="text-display gradient-text" style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
              Code829
            </div>
            <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Your events, your way
            </Typography.Text>
          </div>

          {magicLinkSent ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <MailOutlined style={{ fontSize: 48, marginBottom: 16, color: 'var(--accent-violet)' }} />
              <Typography.Title level={4} style={{ color: 'var(--text-primary)', margin: '0 0 8px' }}>
                Check your email
              </Typography.Title>
              <Typography.Text style={{ color: 'var(--text-secondary)' }}>
                We sent a login link to your email address.
              </Typography.Text>
              <br />
              <Button
                type="link"
                onClick={() => setMagicLinkSent(false)}
                style={{ marginTop: 16, color: 'var(--accent-violet)' }}
              >
                Try a different email
              </Button>
            </div>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleMagicLink}>
              <Form.Item
                name="email"
                label={<span style={{ color: 'var(--text-secondary)' }}>Email</span>}
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Enter a valid email' },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: 'var(--text-muted)' }} />}
                  placeholder="you@example.com"
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  style={{
                    fontWeight: 600,
                    height: 44,
                    borderRadius: 99,
                    background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                    border: 'none',
                  }}
                >
                  Send Magic Link
                </Button>
              </Form.Item>
            </Form>
          )}
        </div>

        {/* Back to home */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Button type="link" onClick={() => navigate('/')} style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            ← Back to home
          </Button>
        </div>

        {import.meta.env.DEV && (
          <div
            className="glass-card"
            style={{
              marginTop: 16,
              padding: '20px 24px',
              borderRadius: 14,
            }}
          >
            <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              Dev Login
            </Typography.Text>
            <Form form={devForm} layout="vertical" onFinish={handleDevLogin} style={{ marginTop: 12 }}>
              <Form.Item
                name="email"
                rules={[{ required: true, message: 'Email is required' }]}
                style={{ marginBottom: 12 }}
              >
                <Input
                  prefix={<LoginOutlined style={{ color: 'var(--text-muted)' }} />}
                  placeholder="admin@code829.com"
                  size="middle"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button htmlType="submit" loading={loading} block style={{ borderRadius: 10 }}>
                  Dev Login
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
