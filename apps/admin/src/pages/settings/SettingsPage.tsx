import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { App } from 'antd';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import AdminSecuritySection from '@code829/shared/components/auth/AdminSecuritySection';
import StripePayoutsSection from '@code829/shared/components/stripe/StripePayoutsSection';

export default function SettingsPage() {
  const { search, pathname } = useLocation();
  const { message } = App.useApp();

  // Detect a Stripe return purely from the URL — accept either signal:
  //   - `?status=complete` query param (preferred, set by BE return_url)
  //   - landing on `/settings/stripe/return` (path-based fallback)
  const cameFromStripe = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get('status') === 'complete' || pathname.endsWith('/stripe/return');
  }, [search, pathname]);

  // The Payouts section refetches on mount via its hook; the URL itself is the
  // refresh nonce so any change to the search/path string fires a fresh fetch.
  const refreshNonce = `${pathname}|${search}`;

  // Surface a friendly toast once per Stripe-return navigation.
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
