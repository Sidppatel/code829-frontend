import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Typography, App, Card } from 'antd';
import { UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { Helmet } from 'react-helmet-async';
import { authApi } from '../../services/api';
import { useAuthStore } from '@code829/shared/stores/authStore';
import { safeReturnUrl } from '@code829/shared/lib/safeRedirect';

export default function OnboardingPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleSubmit = async (values: { firstName: string; lastName: string; phone?: string }) => {
    setLoading(true);
    try {
      await authApi.updateProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
      });
      const { data: updatedUser } = await authApi.getMe();
      if (token) {
        setAuth(token, updatedUser);
      }
      message.success('Welcome to Code829!');
      navigate(safeReturnUrl(returnUrl), { replace: true });
    } catch {
      message.error('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', padding: '24px 16px' }}>
      <Helmet><title>Complete Profile - Code829</title></Helmet>
      <Card style={{ width: '100%', maxWidth: 440, borderRadius: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Typography.Title level={3} style={{ margin: 0 }}>Complete Your Profile</Typography.Title>
          <Typography.Text type="secondary">Tell us a bit about yourself</Typography.Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ firstName: '', lastName: user.lastName }}
        >
          <Form.Item label="Email">
            <Input value={user.email} disabled style={{ color: 'var(--text-primary)' }} />
          </Form.Item>

          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: 'First name is required' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="First name" size="large" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: 'Last name is required' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Last name" size="large" />
          </Form.Item>

          <Form.Item name="phone" label="Phone (optional)">
            <Input prefix={<PhoneOutlined />} placeholder="(555) 123-4567" size="large" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Get Started
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
