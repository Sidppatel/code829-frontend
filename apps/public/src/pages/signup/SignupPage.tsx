import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, App } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { AxiosError } from 'axios';
import { authApi } from '../../services/api';

interface SignupForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export default function SignupPage() {
  const [form] = Form.useForm<SignupForm>();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { message } = App.useApp();
  const navigate = useNavigate();

  const handleSignup = async (values: SignupForm) => {
    setLoading(true);
    try {
      await authApi.signup(values);
      setSubmitted(true);
      message.success('Account created. Check your email to verify.');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      if (axiosErr.response?.status === 409) {
        message.error(axiosErr.response.data?.message ?? 'An account with that email already exists.');
      } else if (axiosErr.response?.status === 429) {
        message.warning('Too many requests. Please try again shortly.');
      } else if (axiosErr.response?.status === 400) {
        message.error(axiosErr.response.data?.message ?? 'Please check the form fields.');
      } else {
        message.error('Signup failed. Please try again.');
      }
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
    }}>
      <Helmet><title>Create Account - Code829</title></Helmet>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 460 }}
      >
        <div
          className="glass-card"
          style={{
            padding: '56px 40px',
            borderRadius: 32,
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: '-1px' }}>
              Create your account
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500, margin: 0 }}>
              Sign up with email and password.
            </p>
          </div>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'var(--bg-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <MailOutlined style={{ fontSize: 32, color: 'var(--accent-violet)' }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                Check your email
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
                We sent a verification link to your inbox. Click it to activate your account and sign in.
              </p>
              <Button
                type="link"
                onClick={() => navigate('/login')}
                style={{ marginTop: 16, color: 'var(--accent-violet)', fontWeight: 700 }}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleSignup} requiredMark={false}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Form.Item
                  name="firstName"
                  style={{ flex: 1 }}
                  rules={[{ required: true, message: 'First name is required' }]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: 'var(--text-muted)', marginRight: 8 }} />}
                    placeholder="First name"
                    size="large"
                    style={{ borderRadius: 14, height: 52, background: 'var(--bg-soft)', border: '1px solid var(--border)', fontSize: 15 }}
                  />
                </Form.Item>
                <Form.Item
                  name="lastName"
                  style={{ flex: 1 }}
                  rules={[{ required: true, message: 'Last name is required' }]}
                >
                  <Input
                    placeholder="Last name"
                    size="large"
                    style={{ borderRadius: 14, height: 52, background: 'var(--bg-soft)', border: '1px solid var(--border)', fontSize: 15 }}
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Invalid email format' },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: 'var(--text-muted)', marginRight: 8 }} />}
                  placeholder="Email address"
                  size="large"
                  style={{ borderRadius: 14, height: 52, background: 'var(--bg-soft)', border: '1px solid var(--border)', fontSize: 15 }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: 'Password is required' },
                  { min: 8, message: 'At least 8 characters' },
                  { pattern: /[A-Z]/, message: 'Must contain at least one uppercase letter' },
                  { pattern: /[0-9]/, message: 'Must contain at least one digit' },
                ]}
                extra={<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>At least 8 characters, one uppercase, one digit.</span>}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'var(--text-muted)', marginRight: 8 }} />}
                  placeholder="Password"
                  size="large"
                  style={{ borderRadius: 14, height: 52, background: 'var(--bg-soft)', border: '1px solid var(--border)', fontSize: 15 }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  style={{
                    height: 56,
                    borderRadius: 14,
                    fontSize: 16,
                    fontWeight: 800,
                    background: 'var(--gradient-brand)',
                    border: 'none',
                    boxShadow: 'var(--shadow-hover)',
                  }}
                >
                  Create account
                </Button>
              </Form.Item>
            </Form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-violet)', fontWeight: 700 }}>
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
