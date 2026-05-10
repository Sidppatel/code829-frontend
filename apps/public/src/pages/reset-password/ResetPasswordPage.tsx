import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, App } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { AxiosError } from 'axios';
import { authApi } from '../../services/api';

interface ResetForm {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const [form] = Form.useForm<ResetForm>();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [searchParams] = useSearchParams();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const handleSubmit = async (values: ResetForm) => {
    if (!token) {
      message.error('Missing reset token.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, values.newPassword);
      setDone(true);
      message.success('Password updated. Please sign in.');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      if (axiosErr.response?.status === 401) {
        message.error(axiosErr.response.data?.message ?? 'Invalid or expired reset token.');
      } else if (axiosErr.response?.status === 400) {
        message.error(axiosErr.response.data?.message ?? 'Please check the form fields.');
      } else {
        message.error('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, padding: 24 }}>
        <Helmet><title>Reset Password - Code829</title></Helmet>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Missing reset token</h2>
        <p style={{ color: 'var(--text-secondary)' }}>This link is invalid. Please request a new password reset.</p>
        <Link to="/forgot-password" style={{ color: 'var(--accent-violet)', fontWeight: 700 }}>
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <Helmet><title>Reset Password - Code829</title></Helmet>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 460 }}
      >
        <div
          className="glass-card"
          style={{ padding: '56px 40px', borderRadius: 32, boxShadow: 'var(--card-shadow)' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 10 }}>
              Choose a new password
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>
              Enter and confirm your new password.
            </p>
          </div>

          {done ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                Password updated
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                You can now sign in with your new password.
              </p>
              <Button
                type="primary"
                onClick={() => navigate('/login')}
                size="large"
                style={{
                  height: 52, borderRadius: 14, fontWeight: 800, paddingInline: 32,
                  background: 'var(--gradient-brand)', border: 'none',
                }}
              >
                Go to sign in
              </Button>
            </div>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
              <Form.Item
                name="newPassword"
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
                  placeholder="New password"
                  size="large"
                  style={{ borderRadius: 14, height: 52, background: 'var(--bg-soft)', border: '1px solid var(--border)', fontSize: 15 }}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'var(--text-muted)', marginRight: 8 }} />}
                  placeholder="Confirm new password"
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
                    height: 56, borderRadius: 14, fontSize: 16, fontWeight: 800,
                    background: 'var(--gradient-brand)', border: 'none', boxShadow: 'var(--shadow-hover)',
                  }}
                >
                  Update password
                </Button>
              </Form.Item>
            </Form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
