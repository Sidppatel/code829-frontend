import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { App, Button } from 'antd';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import { stripeConnectApi } from '@code829/shared/services/stripeConnectApi';
import { createLogger } from '@code829/shared/lib/logger';
import type { OnboardingLinkScope } from '@code829/shared/types/organizations';

const log = createLogger('Admin/StripeRefreshPage');

export default function StripeRefreshPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [errored, setErrored] = useState<string | null>(null);
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;

    const rawScope = searchParams.get('scope');
    const scope: OnboardingLinkScope = rawScope === 'bank' ? 'bank' : 'identity';

    (async () => {
      try {
        const { data } = await stripeConnectApi.adminResumeOnboardingLink(scope);
        window.location.href = data.url;
      } catch (err) {
        log.error('Failed to refresh Stripe onboarding link', err);
        message.error('Could not generate a fresh Stripe link.');
        setErrored('We were unable to refresh your Stripe onboarding link.');
      }
    })();
  }, [searchParams, message]);

  if (errored) {
    return (
      <div style={{ maxWidth: 480, margin: '64px auto', textAlign: 'center', padding: '0 24px' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", marginBottom: 12 }}>
          Stripe link unavailable
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{errored}</p>
        <Button
          type="primary"
          onClick={() => navigate('/settings', { replace: true })}
          style={{ minHeight: 44, minWidth: 200 }}
        >
          Back to Settings
        </Button>
      </div>
    );
  }

  return <LoadingSpinner />;
}
