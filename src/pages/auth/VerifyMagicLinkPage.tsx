import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Typography, App, Spin } from 'antd';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

export default function VerifyMagicLinkPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Verifying your login...');
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (verifiedRef.current) return;
    const token = searchParams.get('token');
    if (!token) {
      queueMicrotask(() => setError('No token provided'));
      return;
    }

    verifiedRef.current = true;

    const verify = async (attempt: number): Promise<void> => {
      try {
        if (attempt > 1) {
          setStatus(`Connecting to server... (attempt ${attempt}/${MAX_RETRIES})`);
        }
        const { data } = await authApi.verifyMagicLink(token);
        setAuth(data.token, data.user);
        const returnUrl = searchParams.get('returnUrl');
        if (!data.user.hasCompletedOnboarding) {
          const onboardUrl = returnUrl ? `/onboarding?returnUrl=${encodeURIComponent(returnUrl)}` : '/onboarding';
          navigate(onboardUrl, { replace: true });
        } else {
          message.success(`Welcome back, ${data.user.firstName}!`);
          navigate(returnUrl ?? '/', { replace: true });
        }
      } catch (err) {
        // Retry on network errors or 5xx (backend cold start)
        const isRetryable =
          !navigator.onLine ||
          (err instanceof Error && 'code' in err && (err as { code: string }).code === 'ERR_NETWORK') ||
          (err instanceof Error && 'response' in err && (err as { response?: { status: number } }).response?.status !== undefined &&
            (err as { response: { status: number } }).response.status >= 500);

        if (isRetryable && attempt < MAX_RETRIES) {
          setStatus(`Server is waking up... retrying in ${RETRY_DELAY_MS / 1000}s (${attempt}/${MAX_RETRIES})`);
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          return verify(attempt + 1);
        }
        setError('This link is invalid or has expired. Please request a new one.');
      }
    };

    void verify(1);
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
      <Typography.Text type="secondary">{status}</Typography.Text>
    </div>
  );
}
