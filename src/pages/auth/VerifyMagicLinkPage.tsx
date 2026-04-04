import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Typography, App, Spin } from 'antd';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function VerifyMagicLinkPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (verifiedRef.current) return;
    const token = searchParams.get('token');
    if (!token) {
      setError('No token provided');
      return;
    }

    verifiedRef.current = true;
    const verify = async () => {
      try {
        const { data } = await authApi.verifyMagicLink(token);
        setAuth(data.token, data.user);
        if (!data.user.hasCompletedOnboarding) {
          navigate('/onboarding', { replace: true });
        } else {
          message.success(`Welcome back, ${data.user.firstName}!`);
          navigate('/', { replace: true });
        }
      } catch {
        setError('This link is invalid or has expired. Please request a new one.');
      }
    };
    void verify();
  }, [searchParams, setAuth, message, navigate]);

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <Typography.Title level={4}>Login Failed</Typography.Title>
        <Typography.Text type="secondary">{error}</Typography.Text>
        <a href="/login">Back to login</a>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <Spin size="large" />
      <Typography.Text type="secondary">Verifying your login...</Typography.Text>
    </div>
  );
}
