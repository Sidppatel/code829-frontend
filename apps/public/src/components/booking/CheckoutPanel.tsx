import { Card, Descriptions, Divider, Typography, Space, Alert } from 'antd';
import { Elements } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { centsToUSD } from '@code829/shared/utils/currency';
import type { TableLock } from '@code829/shared/types/layout';
import TableLockTimer from './TableLockTimer';
import StripePaymentForm from './StripePaymentForm';

interface GridCheckoutProps {
  mode: 'grid';
  tableLock: TableLock;
  confirming: boolean;
  setConfirming: (v: boolean) => void;
  error: string | null;
  clientSecret: string | null;
  stripePromise: Promise<Stripe | null> | null;
  onPaymentSuccess: () => void;
  onCancel: () => void;
  onExpired: () => void;
  taxAmountCents?: number | null;
}

interface OpenCheckoutProps {
  mode: 'open';
  seatCount: number;
  pricePerPersonCents: number;
  confirming: boolean;
  setConfirming: (v: boolean) => void;
  error: string | null;
  clientSecret: string | null;
  stripePromise: Promise<Stripe | null> | null;
  onPaymentSuccess: () => void;
  onCancel: () => void;
  taxAmountCents?: number | null;
}

type Props = GridCheckoutProps | OpenCheckoutProps;

export default function CheckoutPanel(props: Props) {
  const { mode, confirming, setConfirming, error, clientSecret, stripePromise, onPaymentSuccess, onCancel, taxAmountCents } = props;

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

  const tax = taxAmountCents ?? 0;
  const total = subtotal + tax;

  return (
    <Card title="Checkout" styles={{ header: { borderBottom: 'none' } }}>
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
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

        {taxAmountCents ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography.Text>Subtotal</Typography.Text>
              <Typography.Text>{centsToUSD(subtotal)}</Typography.Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography.Text>Tax</Typography.Text>
              <Typography.Text>{centsToUSD(taxAmountCents)}</Typography.Text>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography.Text strong>Total</Typography.Text>
              <Typography.Text strong style={{ fontSize: 18 }}>{centsToUSD(total)}</Typography.Text>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography.Text strong>Total</Typography.Text>
              <Typography.Text strong style={{ fontSize: 18 }}>{centsToUSD(subtotal)}</Typography.Text>
            </div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              + applicable taxes
            </Typography.Text>
          </>
        )}

        {error && (
          <Alert type="error" title={error} showIcon />
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
