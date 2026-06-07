import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Spin, App } from 'antd';
import { Helmet } from 'react-helmet-async';
import { authApi } from '../../services/api';
import { useAuthStore } from '@code829/shared/stores/authStore';
import { ORGANIZER_NAME } from '@code829/shared';

const MAX_RETRIES = 8;
const RETRY_DELAY_MS = 6000;

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Verifying your email...');
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (verifiedRef.current) return;
    const token = searchParams.get('token');
    if (!token) {
      queueMicrotask(() => setError('No verification token provided'));
      return;
    }
    verifiedRef.current = true;

    const verify = async (attempt: number): Promise<void> => {
      try {
        if (attempt > 1) setStatus(`Connecting to server... (attempt ${attempt}/${MAX_RETRIES})`);
        const { data } = await authApi.verifyEmail(token);
        setUser(data.user);
        message.success(`Welcome, ${data.user.firstName}! Email verified.`);
        if (!data.user.hasCompletedOnboarding) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch (err) {
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
        setError('This verification link is invalid or has expired. Please sign up again or request a new link.');
      }
    };

    void verify(1);
  }, [searchParams, setUser, message, navigate]);

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, padding: 24 }}>
        <Helmet><title>{`Verify Email - ${ORGANIZER_NAME}`}</title></Helmet>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Verification failed</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 400 }}>{error}</p>
        <Link to="/signup" style={{ color: 'var(--accent-violet)', fontWeight: 700 }}>
          Sign up again
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, padding: 24 }}>
      <Helmet><title>{`Verify Email - ${ORGANIZER_NAME}`}</title></Helmet>
      <Spin size="large" />
      <p style={{ color: 'var(--text-secondary)' }}>{status}</p>
    </div>
  );
}
