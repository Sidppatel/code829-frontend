import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, App } from 'antd';
import { MailOutlined, LoginOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { AxiosError } from 'axios';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';


export default function LoginPage() {
  const [form] = Form.useForm();
  const [devForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const setAuth = useAuthStore((s) => s.setAuth);

  const startCooldown = useCallback((seconds: number) => {
    setCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const formatCooldown = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const handleMagicLink = async (values: { email: string }) => {
    setLoading(true);
    try {
      await authApi.requestMagicLink(values.email, returnUrl ?? undefined, window.location.origin);
      setMagicLinkSent(true);
      message.success('Check your email for the login link');
    } catch (err) {
      const axiosErr = err as AxiosError<{ retryAfterSeconds?: number }>;
      if (axiosErr.response?.status === 429 && axiosErr.response.data?.retryAfterSeconds) {
        startCooldown(axiosErr.response.data.retryAfterSeconds);
        message.warning('Please wait before requesting another link');
      } else {
        message.error('Failed to send magic link');
      }
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
      navigate(returnUrl ?? '/');
    } catch {
      message.error('Dev login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: 460,
          zIndex: 10,
        }}
      >
        <div 
          className="glass-card"
          style={{
            padding: '60px 40px',
            borderRadius: 36,
            boxShadow: 'var(--card-shadow)',
            position: 'relative'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ 
              width: 64, 
              height: 64, 
              borderRadius: 18, 
              background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-rose))', 
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 28,
              boxShadow: '0 12px 24px rgba(99, 102, 241, 0.2)'
            }}>
              ✦
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-1.5px' }}>
              Welcome back
            </h1>
            <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 500 }}>
              Sign in to your premium account.
            </Typography.Text>
          </div>

          {magicLinkSent ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                background: 'rgba(99, 102, 241, 0.05)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 24px' 
              }}>
                <MailOutlined style={{ fontSize: 32, color: 'var(--accent-violet)' }} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Check your mail</h2>
              <Typography.Paragraph style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
                We've sent a magic login link to your inbox. <br />
                Please click the link to sign in securely.
              </Typography.Paragraph>
              <Button
                type="link"
                onClick={() => setMagicLinkSent(false)}
                style={{ marginTop: 24, color: 'var(--accent-violet)', fontWeight: 700 }}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleMagicLink} requiredMark={false}>
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Enter a valid email' },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: 'var(--text-muted)', marginRight: 8 }} />}
                  placeholder="Email address"
                  size="large"
                  style={{ 
                    borderRadius: 16, 
                    height: 56, 
                    background: 'rgba(0,0,0,0.03)', 
                    border: '1px solid var(--border)',
                    fontSize: 16
                  }}
                  disabled={cooldown > 0}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={cooldown > 0}
                  block
                  size="large"
                  style={{
                    height: 60,
                    borderRadius: 16,
                    fontSize: 17,
                    fontWeight: 800,
                    background: cooldown > 0
                      ? 'var(--bg-elevated)'
                      : 'linear-gradient(135deg, var(--accent-violet), var(--accent-rose))',
                    border: 'none',
                    boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)',
                    marginTop: 12,
                  }}
                >
                  {cooldown > 0 ? `Retry in ${formatCooldown(cooldown)}` : 'Continue with Email'}
                </Button>
              </Form.Item>
            </Form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
            New to the platform? <Link to="/events" style={{ color: 'var(--accent-violet)', fontWeight: 700 }}>Explore experiences</Link>
          </p>
        </div>

        {import.meta.env.DEV && (
          <div
            className="glass-card"
            style={{
              marginTop: 24,
              padding: '32px',
              borderRadius: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 4, height: 16, background: 'var(--accent-rose)', borderRadius: 2 }} />
              <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Developer Access
              </Typography.Text>
            </div>
            <Form form={devForm} layout="vertical" onFinish={handleDevLogin} style={{ marginTop: 12 }}>
              <Form.Item
                name="email"
                rules={[{ required: true, message: 'Email is required' }]}
                style={{ marginBottom: 20 }}
              >
                <Input
                  prefix={<LoginOutlined style={{ color: 'var(--text-muted)', marginRight: 8 }} />}
                  placeholder="admin@code829.com"
                  size="large"
                  style={{ borderRadius: 14, height: 50, background: 'rgba(0,0,0,0.02)' }}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button 
                  htmlType="submit" 
                  loading={loading} 
                  block 
                  style={{ borderRadius: 14, height: 50, fontWeight: 700, border: '1px solid var(--border)', background: 'transparent' }}
                >
                  Bypass with Dev Login
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
    </motion.div>
  </div>
  );
}
