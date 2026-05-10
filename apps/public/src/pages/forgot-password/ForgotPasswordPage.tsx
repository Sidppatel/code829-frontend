import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, App } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { AxiosError } from 'axios';
import { authApi } from '../../services/api';

interface ForgotForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const [form] = Form.useForm<ForgotForm>();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { message } = App.useApp();

  const handleSubmit = async (values: ForgotForm) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(values.email);
      setSubmitted(true);
    } catch (err) {
      const axiosErr = err as AxiosError;
      const status = axiosErr.response?.status;
      if (status === 429) {
        message.warning('Too many requests. Please try again shortly.');
      } else if (status === 404) {
        message.error('No account found with that email.');
      } else {
        message.error('Could not send reset email. Please try again shortly.');
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
      <Helmet><title>Forgot Password - Code829</title></Helmet>
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
              Reset your password
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
              }}>
                <MailOutlined style={{ fontSize: 32, color: 'var(--accent-violet)' }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                Check your email
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
                If an account exists for that email, a password reset link is on its way.
              </p>
            </div>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
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
              <Form.Item style={{ marginBottom: 0 }}>
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
                  Send reset link
                </Button>
              </Form.Item>
            </Form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/login" style={{ color: 'var(--accent-violet)', fontWeight: 700, fontSize: 14 }}>
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
