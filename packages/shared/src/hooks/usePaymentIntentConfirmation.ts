import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { App } from 'antd';
import { purchasesApi } from '../services/purchasesApi';
import { createLogger } from '../lib/logger';

const log = createLogger('usePaymentIntentConfirmation');

interface Options {
  onConfirmed?: () => void;
}

export function usePaymentIntentConfirmation(options: Options = {}) {
  const { message } = App.useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (confirmedRef.current) return;
    const paymentIntent = searchParams.get('payment_intent');
    const redirectStatus = searchParams.get('redirect_status');
    if (!paymentIntent || redirectStatus !== 'succeeded') return;

    confirmedRef.current = true;
    const confirm = async () => {
      try {
        await purchasesApi.confirmByPaymentIntent(paymentIntent);
        log.info('Payment confirmed via Stripe redirect', { paymentIntent });
        void message.success('Payment confirmed!');
      } catch (err) {
        log.error('Failed to confirm payment intent', err);
        void message.warning('Payment received — purchase will update shortly');
      }
      setSearchParams({}, { replace: true });
      options.onConfirmed?.();
    };
    void confirm();
  }, [searchParams, setSearchParams, message, options]);
}
