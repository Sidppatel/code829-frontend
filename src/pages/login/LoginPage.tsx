import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, App, Space } from 'antd';
import { MailOutlined, LoginOutlined } from '@ant-design/icons';
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
    <div style={{ maxWidth: 440, margin: '48px auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <Typography.Title level={2}>Sign In</Typography.Title>
          <Typography.Text type="secondary">
            Enter your email to receive a magic login link
          </Typography.Text>
        </div>

        <Card>
          {magicLinkSent ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <MailOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <Typography.Title level={4}>Check your email</Typography.Title>
              <Typography.Text type="secondary">
                We sent a login link to your email address.
              </Typography.Text>
              <br />
              <Button
                type="link"
                onClick={() => setMagicLinkSent(false)}
                style={{ marginTop: 16 }}
              >
                Try a different email
              </Button>
            </div>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleMagicLink}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Enter a valid email' },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
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
                >
                  Send Magic Link
                </Button>
              </Form.Item>
            </Form>
          )}
        </Card>

        {import.meta.env.DEV && (
          <Card
            title="Dev Login"
            size="small"
            styles={{ header: { borderBottom: 'none' } }}
          >
            <Form form={devForm} layout="vertical" onFinish={handleDevLogin}>
              <Form.Item
                name="email"
                rules={[{ required: true, message: 'Email is required' }]}
              >
                <Input
                  prefix={<LoginOutlined />}
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
    </div>
  );
}
