import { Card, Descriptions, Divider, Typography, Space, Alert } from 'antd';
import { Elements } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { centsToUSD } from '../../utils/currency';
import type { TableLock } from '../../types/layout';
import TableLockTimer from './TableLockTimer';
import StripePaymentForm from './StripePaymentForm';

interface GridCheckoutProps {
  mode: 'grid';
  tableLock: TableLock;
  platformFeeCents: number;
  confirming: boolean;
  setConfirming: (v: boolean) => void;
  error: string | null;
  clientSecret: string | null;
  stripePromise: Promise<Stripe | null> | null;
  onPaymentSuccess: () => void;
  onCancel: () => void;
  onExpired: () => void;
}

interface OpenCheckoutProps {
  mode: 'open';
  seatCount: number;
  pricePerPersonCents: number;
  platformFeeCents: number;
  confirming: boolean;
  setConfirming: (v: boolean) => void;
  error: string | null;
  clientSecret: string | null;
  stripePromise: Promise<Stripe | null> | null;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

type Props = GridCheckoutProps | OpenCheckoutProps;

export default function CheckoutPanel(props: Props) {
  const { mode, platformFeeCents, confirming, setConfirming, error, clientSecret, stripePromise, onPaymentSuccess, onCancel } = props;

  let subtotal: number;
  let description: string;

  if (mode === 'grid') {
    const { tableLock } = props;
    subtotal = tableLock.priceCents;
    description = `Table ${tableLock.tableLabel} - ${tableLock.capacity} seats`;
  } else {
    const { seatCount, pricePerPersonCents } = props;
    subtotal = seatCount * pricePerPersonCents;
    description = `${seatCount} seat${seatCount !== 1 ? 's' : ''} x ${centsToUSD(pricePerPersonCents)}`;
  }

  const total = subtotal + platformFeeCents;

  return (
    <Card title="Checkout" styles={{ header: { borderBottom: 'none' } }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {mode === 'grid' && (
          <TableLockTimer
            expiresAt={(props as GridCheckoutProps).tableLock.expiresAt}
            onExpired={(props as GridCheckoutProps).onExpired}
          />
        )}

        <Descriptions column={1} size="small">
          {mode === 'grid' && (
            <>
              <Descriptions.Item label="Table">
                {(props as GridCheckoutProps).tableLock.tableLabel}
              </Descriptions.Item>
              <Descriptions.Item label="Seats included">
                {(props as GridCheckoutProps).tableLock.capacity}
              </Descriptions.Item>
              <Descriptions.Item label="Pricing">
                Whole table (not per seat)
              </Descriptions.Item>
            </>
          )}
          {mode === 'open' && (
            <Descriptions.Item label="Order">{description}</Descriptions.Item>
          )}
        </Descriptions>

        <Divider style={{ margin: '8px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text>Subtotal</Typography.Text>
          <Typography.Text>{centsToUSD(subtotal)}</Typography.Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text type="secondary">Platform Fee</Typography.Text>
          <Typography.Text type="secondary">{centsToUSD(platformFeeCents)}</Typography.Text>
        </div>
        <Divider style={{ margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text strong>Total</Typography.Text>
          <Typography.Text strong style={{ fontSize: 18 }}>{centsToUSD(total)}</Typography.Text>
        </div>

        {error && (
          <Alert type="error" message={error} showIcon />
        )}

        {clientSecret && stripePromise ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripePaymentForm
              onSuccess={onPaymentSuccess}
              onCancel={onCancel}
              confirming={confirming}
              setConfirming={setConfirming}
            />
          </Elements>
        ) : (
          <Typography.Text type="secondary">Loading payment form...</Typography.Text>
        )}
      </Space>
    </Card>
  );
}
