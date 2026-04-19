import { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, Card, App, Spin, Result } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { adminAuthApi } from '../../services/adminAuthApi';
import type { InvitationInfoDto } from '../../types/auth';
import BrandLogo from '../shared/BrandLogo';
import PasswordForm from './PasswordForm';

export default function InvitationSignupForm() {
  const [info, setInfo] = useState<InvitationInfoDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [names, setNames] = useState<{ firstName: string; lastName: string } | null>(null);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { message } = App.useApp();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setFetching(false);
      return;
    }
    adminAuthApi.getInvitationInfo(token)
      .then(({ data }) => setInfo(data))
      .catch(() => setError('Invalid or expired invitation'))
      .finally(() => setFetching(false));
  }, [token]);

  if (fetching) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !info) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Result status="error" title="Invalid Invitation" subTitle={error || 'This invitation link is invalid or has expired.'} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Card style={{ maxWidth: 460, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <BrandLogo size="lg" />
          <Typography.Title level={3} style={{ marginTop: 16, marginBottom: 4 }}>
            Create Your Account
          </Typography.Title>
          <Typography.Text type="secondary">
            {info.invitedByName} invited you to join as {info.role === 'Admin' ? 'an' : 'a'} {info.role}
          </Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {info.email}
          </Typography.Text>
        </div>

        {!names ? (
          <Form
            layout="vertical"
            autoComplete="off"
            onFinish={(values: { firstName: string; lastName: string }) =>
              setNames({ firstName: values.firstName.trim(), lastName: values.lastName.trim() })
            }
          >
            <Form.Item
              name="firstName"
              rules={[{ required: true, whitespace: true, message: 'Please enter your first name' }]}
            >
              <Input placeholder="First name" size="large" />
            </Form.Item>
            <Form.Item
              name="lastName"
              rules={[{ required: true, whitespace: true, message: 'Please enter your last name' }]}
            >
              <Input placeholder="Last name" size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                Continue
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <PasswordForm
            mode="create"
            onSubmit={async ({ newPassword }) => {
              if (!token) return;
              const { data } = await adminAuthApi.signup({
                token,
                firstName: names.firstName,
                lastName: names.lastName,
                password: newPassword,
              });
              setAuth(data.token, data.user);
              message.success('Password set successfully! Please complete your profile.');
              navigate('/profile', { replace: true, state: { setup: true } });
            }}
            submitLabel="Create Account"
          />
        )}
      </Card>
    </div>
  );
}
