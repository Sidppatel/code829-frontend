import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import AdminSecuritySection from '@code829/shared/components/auth/AdminSecuritySection';
import StripePayoutsSection from '@code829/shared/components/stripe/StripePayoutsSection';

export default function SettingsPage() {
  const { search } = useLocation();
  const [refreshNonce, setRefreshNonce] = useState(() => Date.now());

  // Bump the nonce on mount so the Payouts section always refetches when the
  // admin lands here, and again whenever the URL signals we just returned from
  // the Stripe-hosted onboarding flow (`/settings/stripe/return?status=complete`).
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('status') === 'complete') {
      setRefreshNonce(Date.now());
    }
  }, [search]);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Account security and payouts" />
      <AdminSecuritySection />
      <StripePayoutsSection refreshNonce={refreshNonce} />
    </div>
  );
}
