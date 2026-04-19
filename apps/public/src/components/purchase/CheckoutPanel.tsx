import { Card, Descriptions, Divider, Typography, Space, Alert, Skeleton } from 'antd';
import { Elements } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { centsToUSD } from '@code829/shared/utils/currency';
import type { TableLock } from '@code829/shared/types/layout';
import type { PricingQuote } from '@code829/shared/types/pricing';
import TableLockTimer from './TableLockTimer';
import StripePaymentForm from './StripePaymentForm';

interface GridCheckoutProps {
  mode: 'grid';
  tableLocks: TableLock[];
  confirming: boolean;
  setConfirming: (v: boolean) => void;
  error: string | null;
  clientSecret: string | null;
  stripePromise: Promise<Stripe | null> | null;
  onPaymentSuccess: () => void;
  onCancel: () => void;
  onExpired: () => void;
  quote: PricingQuote | null;
  quoteLoading: boolean;
  quoteError: string | null;
}

interface OpenCheckoutProps {
  mode: 'open';
  seatCount: number;
  confirming: boolean;
  setConfirming: (v: boolean) => void;
  error: string | null;
  clientSecret: string | null;
  stripePromise: Promise<Stripe | null> | null;
  onPaymentSuccess: () => void;
  onCancel: () => void;
  quote: PricingQuote | null;
  quoteLoading: boolean;
  quoteError: string | null;
}

type Props = GridCheckoutProps | OpenCheckoutProps;

export default function CheckoutPanel(props: Props) {
  const { mode, confirming, setConfirming, error, clientSecret, stripePromise, onPaymentSuccess, onCancel, quote, quoteLoading, quoteError } = props;

  let description: string;
  if (mode === 'grid') {
    const { tableLocks } = props;
    const labels = tableLocks.map(l => l.tableLabel).join(', ');
    const totalSeats = quote?.seatsIncluded;
    description = totalSeats !== undefined
      ? `Table${tableLocks.length > 1 ? 's' : ''} ${labels} — ${totalSeats} seats`
      : `Table${tableLocks.length > 1 ? 's' : ''} ${labels}`;
  } else {
    description = `${props.seatCount} seat${props.seatCount !== 1 ? 's' : ''}`;
  }

  return (
    <Card title="Checkout" styles={{ header: { borderBottom: 'none' } }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {mode === 'grid' && (() => {
          const earliest = (props as GridCheckoutProps).tableLocks
            .map(l => l.expiresAt).sort()[0];
          return earliest ? (
            <TableLockTimer
              expiresAt={earliest}
              onExpired={(props as GridCheckoutProps).onExpired}
            />
          ) : null;
        })()}

        <Descriptions column={1} size="small">
          {mode === 'grid' && (() => {
            const locks = (props as GridCheckoutProps).tableLocks;
            return (
              <>
                <Descriptions.Item label={locks.length > 1 ? 'Tables' : 'Table'}>
                  {locks.map(l => l.tableLabel).join(', ')}
                </Descriptions.Item>
                <Descriptions.Item label="Seats included">
                  {quote?.seatsIncluded ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Pricing">
                  {locks.length > 1 ? `${locks.length} whole tables (not per seat)` : 'Whole table (not per seat)'}
                </Descriptions.Item>
              </>
            );
          })()}
          {mode === 'open' && (
            <Descriptions.Item label="Order">{description}</Descriptions.Item>
          )}
        </Descriptions>

        <Divider style={{ margin: '8px 0' }} />

        {quoteError ? (
          <Alert type="error" message="Unable to load pricing" description={quoteError} showIcon />
        ) : quoteLoading || !quote ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : (
          <>
            {/* Customers see only the admission price (admin price + platform fee rolled in) and tax. */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography.Text>Subtotal</Typography.Text>
              <Typography.Text>{centsToUSD(quote.displaySubtotalCents)}</Typography.Text>
            </div>
            {quote.taxCents > 0 ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography.Text>Tax</Typography.Text>
                  <Typography.Text>{centsToUSD(quote.taxCents)}</Typography.Text>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography.Text strong>Total</Typography.Text>
                  <Typography.Text strong style={{ fontSize: 18 }}>{quote.formattedTotal}</Typography.Text>
                </div>
              </>
            ) : (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography.Text strong>Total</Typography.Text>
                  <Typography.Text strong style={{ fontSize: 18 }}>{quote.formattedTotal}</Typography.Text>
                </div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  + applicable taxes
                </Typography.Text>
              </>
            )}
          </>
        )}

        {error && (
          <Alert type="error" message={error} showIcon />
        )}

        <div className="checkout-pay-sticky">
          {clientSecret && stripePromise ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripePaymentForm
                onSuccess={onPaymentSuccess}
                onCancel={onCancel}
                confirming={confirming}
                setConfirming={setConfirming}
              />
            </Elements>
          ) : error ? (
            <Alert type="warning" message="Payment unavailable" description="Payment service is not ready. Please refresh and try again." showIcon />
          ) : (
            <Skeleton.Input active block style={{ height: 140 }} />
          )}
        </div>
      </Space>
    </Card>
  );
}
