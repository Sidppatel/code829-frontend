import { useEffect, useState, useCallback } from 'react';
import { Form, Input, Button, App } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { adminAuthApi } from '@code829/shared/services/adminAuthApi';
import type { AdminUserProfile } from '@code829/shared/types/auth';
import { useAuthStore } from '@code829/shared/stores/authStore';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import HumanCard from '@code829/shared/components/shared/HumanCard';

export default function SettingsPage() {
  const [profile, setProfile] = useState<AdminUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  const load = useCallback(async () => {
    try {
      const { data } = await adminAuthApi.getMe();
      setProfile(data);
    } catch {
      message.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => { Promise.resolve().then(() => load()); }, [load]);

  const handleSave = async (values: { firstName: string; lastName: string; phone: string }) => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (values.firstName?.trim()) payload.firstName = values.firstName.trim();
      if (values.lastName?.trim()) payload.lastName = values.lastName.trim();
      if (values.phone?.trim()) payload.phone = values.phone.trim();
      const { data } = await adminAuthApi.updateProfile(payload);
      setProfile(data);
      if (token) setAuth(token, data);
      message.success('Profile updated');
    } catch {
      message.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your account details" />
      <HumanCard style={{ maxWidth: 560, padding: 28 }}>
        <Form layout="vertical" onFinish={handleSave} initialValues={{ firstName: profile?.firstName, lastName: profile?.lastName, phone: profile?.phone ?? '' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Email</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{profile?.email}</div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Role</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{profile?.role}</div>
          </div>
          <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Required' }]}>
            <Input size="large" style={{ borderRadius: 12 }} />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Required' }]}>
            <Input size="large" style={{ borderRadius: 12 }} />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input size="large" style={{ borderRadius: 12 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large" style={{ borderRadius: 12 }}>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </HumanCard>
    </div>
  );
}
