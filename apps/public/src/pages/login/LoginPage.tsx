import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Form, Input, Button, App } from 'antd';
import { MailOutlined, LoginOutlined, LockOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { AxiosError } from 'axios';
import { authApi } from '../../services/api';
import { useAuthStore } from '@code829/shared/stores/authStore';
import { safeReturnUrl } from '@code829/shared/lib/safeRedirect';
import Text from '@code829/shared/components/shared/Text';
import { strings, textTemplates } from '@code829/shared/theme/strings';

type Mode = 'password' | 'magic-link';

export default function LoginPage() {
  const [form] = Form.useForm<{ email: string; password?: string }>();
  const [devForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('password');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const setUser = useAuthStore((s) => s.setUser);

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
      message.success(strings.errors.magicLinkSuccess.text);
    } catch (err) {
      const axiosErr = err as AxiosError<{ retryAfterSeconds?: number }>;
      if (axiosErr.response?.status === 429 && axiosErr.response.data?.retryAfterSeconds) {
        startCooldown(axiosErr.response.data.retryAfterSeconds);
        message.warning(strings.errors.magicLinkRateLimited.text);
      } else {
        message.error(strings.errors.magicLinkFailed.text);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSignin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await authApi.signin(values.email, values.password);
      setUser(data.user);
      message.success(textTemplates.loggedInAs(data.user.firstName).text);
      if (!data.user.hasCompletedOnboarding) {
        const onboardUrl = returnUrl ? `/onboarding?returnUrl=${encodeURIComponent(returnUrl)}` : '/onboarding';
        navigate(onboardUrl);
      } else {
        navigate(safeReturnUrl(returnUrl));
      }
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string; retryAfterSeconds?: number }>;
      if (axiosErr.response?.status === 429 && axiosErr.response.data?.retryAfterSeconds) {
        startCooldown(axiosErr.response.data.retryAfterSeconds);
        message.warning('Too many sign-in attempts. Please try again shortly.');
      } else if (axiosErr.response?.status === 401) {
        message.error(axiosErr.response.data?.message ?? 'Invalid email or password.');
      } else {
        message.error('Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: { email: string; password?: string }) => {
    if (mode === 'magic-link') {
      await handleMagicLink({ email: values.email });
    } else {
      if (!values.password) return;
      await handlePasswordSignin({ email: values.email, password: values.password });
    }
  };

  const handleDevLogin = async (values: { email: string }) => {
    setLoading(true);
    try {
      const { data } = await authApi.devLogin(values.email);
      setUser(data.user);
      message.success(textTemplates.loggedInAs(data.user.firstName).text);
      navigate(safeReturnUrl(returnUrl));
    } catch {
      message.error(strings.errors.devLoginFailed.text);
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
      <Helmet><title>{strings.auth.signInPageTitle.text}</title></Helmet>
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
              background: 'var(--gradient-brand)',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-hover)'
            }}>
              <img
                src="/logo.svg"
                alt="Code829 Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <Text
              token="auth.welcomeBack"
              style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-1.5px' }}
            />
            <Text
              token="auth.signInSubtitle"
              style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 500, margin: 0 }}
            />
          </div>

          {magicLinkSent ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'var(--bg-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <MailOutlined style={{ fontSize: 32, color: 'var(--accent-violet)' }} />
              </div>
              <Text
                token="auth.checkYourMail"
                style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}
              />
              <Text
                token="auth.magicLinkSent"
                style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}
              />
              <Button
                type="link"
                onClick={() => setMagicLinkSent(false)}
                style={{ marginTop: 24, color: 'var(--accent-violet)', fontWeight: 700 }}
              >
                <Text token="common.useDifferentEmail" />
              </Button>
            </div>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: strings.validation.emailRequired.text },
                  { type: 'email', message: strings.validation.emailInvalid.text },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: 'var(--text-muted)', marginRight: 8 }} />}
                  placeholder="Email address"
                  size="large"
                  style={{
                    borderRadius: 16,
                    height: 56,
                    background: 'var(--bg-soft)',
                    border: '1px solid var(--border)',
                    fontSize: 16
                  }}
                  disabled={cooldown > 0}
                />
              </Form.Item>

              {mode === 'password' && (
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: 'Password is required' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: 'var(--text-muted)', marginRight: 8 }} />}
                    placeholder="Password"
                    size="large"
                    style={{
                      borderRadius: 16,
                      height: 56,
                      background: 'var(--bg-soft)',
                      border: '1px solid var(--border)',
                      fontSize: 16,
                    }}
                    disabled={cooldown > 0}
                  />
                </Form.Item>
              )}

              {mode === 'password' && (
                <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 8 }}>
                  <Link to="/forgot-password" style={{ color: 'var(--accent-violet)', fontSize: 13, fontWeight: 600 }}>
                    Forgot password?
                  </Link>
                </div>
              )}

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
                      : 'var(--gradient-brand)',
                    border: 'none',
                    boxShadow: 'var(--shadow-hover)',
                    marginTop: 12,
                  }}
                >
                  {cooldown > 0
                    ? textTemplates.retryInCooldown(formatCooldown(cooldown)).text
                    : mode === 'password'
                      ? 'Sign in'
                      : <Text token="common.continueWithEmail" />}
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Button
                  type="link"
                  onClick={() => setMode(mode === 'password' ? 'magic-link' : 'password')}
                  style={{ color: 'var(--accent-violet)', fontWeight: 600, fontSize: 13 }}
                >
                  {mode === 'password' ? 'Use a magic link instead' : 'Use a password instead'}
                </Button>
              </div>
            </Form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
            New to the platform?{' '}
            <Link to="/signup" style={{ color: 'var(--accent-violet)', fontWeight: 700 }}>
              Create an account
            </Link>
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
              <Text
                token="auth.developerAccess"
                style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}
              />
            </div>
            <Form form={devForm} layout="vertical" onFinish={handleDevLogin} style={{ marginTop: 12 }}>
              <Form.Item
                name="email"
                rules={[{ required: true, message: strings.validation.emailRequired.text }]}
                style={{ marginBottom: 20 }}
              >
                <Input
                  prefix={<LoginOutlined style={{ color: 'var(--text-muted)', marginRight: 8 }} />}
                  placeholder="admin@code829.com"
                  size="large"
                  style={{ borderRadius: 14, height: 50, background: 'var(--bg-soft)' }}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{ borderRadius: 14, height: 50, fontWeight: 700, border: '1px solid var(--border)', background: 'transparent' }}
                >
                  <Text token="auth.devLogin" />
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
    </motion.div>
  </div>
  );
}
