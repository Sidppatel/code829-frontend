import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { App } from 'antd';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import AdminSecuritySection from '@code829/shared/components/auth/AdminSecuritySection';
import StripePayoutsSection from '@code829/shared/components/stripe/StripePayoutsSection';

export default function SettingsPage() {
  const { search, pathname } = useLocation();
  const { message } = App.useApp();

  const cameFromStripe = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get('status') === 'complete' || pathname.endsWith('/stripe/return');
  }, [search, pathname]);

  const refreshNonce = `${pathname}|${search}`;

  const toldOnNonce = useRef<string | null>(null);
  useEffect(() => {
    if (cameFromStripe && toldOnNonce.current !== refreshNonce) {
      toldOnNonce.current = refreshNonce;
      message.success('Welcome back — checking your latest payout status…');
    }
  }, [cameFromStripe, refreshNonce, message]);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Account security and payouts" />
      <AdminSecuritySection />
      <StripePayoutsSection refreshNonce={refreshNonce} />
    </div>
  );
}
