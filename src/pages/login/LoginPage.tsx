import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, App, Space } from 'antd';
import { MailOutlined, LoginOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

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
    <div
      style={{
        maxWidth: 440,
        margin: '48px auto',
        position: 'relative',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.12), transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Typography.Title
              level={2}
              style={{
                fontFamily: "'Playfair Display', serif",
                color: '#F1F0FF',
              }}
            >
              Sign In
            </Typography.Title>
            <Typography.Text style={{ color: '#9CA3AF' }}>
              Enter your email to receive a magic login link
            </Typography.Text>
          </div>

          <Card
            className="glass-card"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {magicLinkSent ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <MailOutlined style={{ fontSize: 48, marginBottom: 16, color: '#7C3AED' }} />
                <Typography.Title level={4} style={{ color: '#F1F0FF' }}>
                  Check your email
                </Typography.Title>
                <Typography.Text style={{ color: '#9CA3AF' }}>
                  We sent a login link to your email address.
                </Typography.Text>
                <br />
                <Button
                  type="link"
                  onClick={() => setMagicLinkSent(false)}
                  style={{ marginTop: 16, color: '#7C3AED' }}
                >
                  Try a different email
                </Button>
              </div>
            ) : (
              <Form form={form} layout="vertical" onFinish={handleMagicLink}>
                <Form.Item
                  name="email"
                  label={<span style={{ color: '#9CA3AF' }}>Email</span>}
                  rules={[
                    { required: true, message: 'Email is required' },
                    { type: 'email', message: 'Enter a valid email' },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined style={{ color: '#6B7280' }} />}
                    placeholder="you@example.com"
                    size="large"
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    size="large"
                    style={{ fontWeight: 600 }}
                  >
                    Send Magic Link
                  </Button>
                </Form.Item>
              </Form>
            )}
          </Card>

          {import.meta.env.DEV && (
            <Card
              title={<span style={{ color: '#9CA3AF' }}>Dev Login</span>}
              size="small"
              style={{
                background: '#13131A',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
              }}
              styles={{ header: { borderBottom: '1px solid rgba(255, 255, 255, 0.06)' } }}
            >
              <Form form={devForm} layout="vertical" onFinish={handleDevLogin}>
                <Form.Item
                  name="email"
                  rules={[{ required: true, message: 'Email is required' }]}
                >
                  <Input
                    prefix={<LoginOutlined style={{ color: '#6B7280' }} />}
                    placeholder="admin@code829.com"
                    size="middle"
                  />
                </Form.Item>
                <Form.Item>
                  <Button htmlType="submit" loading={loading} block>
                    Dev Login
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          )}
        </Space>
      </motion.div>
    </div>
  );
}
