import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, App, Space, Tag, Typography, Alert } from 'antd';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { createLogger } from '@code829/shared/lib/logger';
import { authApi } from '../../services/api';
import { useAuthStore } from '@code829/shared/stores/authStore';
import type { UserProfile } from '@code829/shared/types/auth';
import PagePreamble from '../../components/layout/PagePreamble';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';

const log = createLogger('Public/SecurityPage');

interface FormValues {
  currentPassword?: string;
  newPassword: string;
  confirmNewPassword: string;
}

export default function SecurityPage() {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [topError, setTopError] = useState<string | null>(null);
  const { message } = App.useApp();
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await authApi.getMe();
        setProfile(data as UserProfile);
        setUser(data as UserProfile);
      } catch (err) {
        log.error('Failed to load profile', err);
        message.error('Failed to load security settings');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [message, setUser]);

  const hasPassword = profile?.hasPassword ?? false;

  const handleSubmit = async (values: FormValues) => {
    setTopError(null);
    if (values.newPassword !== values.confirmNewPassword) {
      form.setFields([
        { name: 'confirmNewPassword', errors: ['Passwords do not match'] },
      ]);
      return;
    }

    try {
      setSaving(true);
      await authApi.setPassword({
        currentPassword: hasPassword ? values.currentPassword : undefined,
        newPassword: values.newPassword,
      });
      message.success(hasPassword ? 'Password updated' : 'Password set');
      form.resetFields();
      const { data: me } = await authApi.getMe();
      setProfile(me as UserProfile);
      setUser(me as UserProfile);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const ax = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
        const status = ax.response?.status;
        const body = ax.response?.data;
        if (status === 401) {
          navigate('/login');
          return;
        }
        if (status === 400) {
          if (body?.errors) {
            const allowed = new Set<keyof FormValues>(['currentPassword', 'newPassword', 'confirmNewPassword']);
            const formFields = Object.entries(body.errors)
              .map(([key, msgs]) => ({
                name: (key.charAt(0).toLowerCase() + key.slice(1)) as keyof FormValues,
                errors: msgs,
              }))
              .filter((f) => allowed.has(f.name));
            if (formFields.length > 0) {
              form.setFields(formFields);
            } else {
              setTopError(body.message ?? 'Validation failed');
            }
          } else {
            setTopError(body?.message ?? 'Could not update password');
          }
        } else {
          setTopError(body?.message ?? 'Could not update password');
        }
      } else {
        setTopError('Could not update password');
      }
      log.error('Set password failed', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) return <LoadingSpinner />;

  return (
    <div>
      <Helmet><title>Security - Code829</title></Helmet>
      <PagePreamble
        kicker="Your account"
        title="Security"
        subtitle="Manage your sign-in methods and password."
      />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 32px 64px' }}>
        <Card title="Sign-in methods" style={{ marginBottom: 24 }}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div>
              <Typography.Text type="secondary">Email</Typography.Text>
              <div>
                <Typography.Text strong>{profile.email}</Typography.Text>{' '}
                {profile.emailVerified ? (
                  <Tag color="green">Verified</Tag>
                ) : (
                  <Tag color="orange">Unverified</Tag>
                )}
              </div>
            </div>
            <div>
              <Typography.Text type="secondary">Active methods</Typography.Text>
              <div>
                <Space size={8} wrap>
                  {profile.hasPassword ? <Tag color="blue">Password</Tag> : null}
                  {profile.hasGoogle ? <Tag color="purple">Google</Tag> : null}
                  {!profile.hasPassword && !profile.hasGoogle ? (
                    <Tag>Magic link</Tag>
                  ) : null}
                </Space>
              </div>
            </div>
          </Space>
        </Card>

        <Card title={hasPassword ? 'Change password' : 'Set password'}>
          {!hasPassword && (
            <Alert
              type="info"
              message="Set a password to also sign in without Google."
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          {topError && (
            <Alert
              type="error"
              message={topError}
              showIcon
              closable
              onClose={() => setTopError(null)}
              style={{ marginBottom: 16 }}
            />
          )}
          <Form<FormValues> form={form} layout="vertical" onFinish={handleSubmit}>
            {hasPassword && (
              <Form.Item
                name="currentPassword"
                label="Current password"
                rules={[{ required: true, message: 'Current password is required' }]}
              >
                <Input.Password autoComplete="current-password" />
              </Form.Item>
            )}
            <Form.Item
              name="newPassword"
              label="New password"
              rules={[
                { required: true, message: 'New password is required' },
                { min: 8, message: 'Password must be at least 8 characters' },
                { pattern: /[A-Z]/, message: 'Password must contain at least one uppercase letter' },
                { pattern: /[0-9]/, message: 'Password must contain at least one digit' },
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              name="confirmNewPassword"
              label="Confirm new password"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please confirm your new password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={saving}>
                {hasPassword ? 'Update password' : 'Set password'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
