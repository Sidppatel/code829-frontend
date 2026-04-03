import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button, Alert, Space } from 'antd';

interface StripePaymentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  confirming: boolean;
  setConfirming: (v: boolean) => void;
}

export default function StripePaymentForm({ onSuccess, onCancel, confirming, setConfirming }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    setConfirming(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? 'Validation failed');
      setConfirming(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/bookings`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed');
      setConfirming(false);
      return;
    }

    onSuccess();
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <PaymentElement />

      {error && <Alert type="error" message={error} showIcon />}

      <Button
        type="primary"
        size="large"
        block
        onClick={handleSubmit}
        loading={confirming}
        disabled={!stripe || !elements}
      >
        Pay Now
      </Button>
      <Button block onClick={onCancel} disabled={confirming}>
        Cancel
      </Button>
    </Space>
  );
}
