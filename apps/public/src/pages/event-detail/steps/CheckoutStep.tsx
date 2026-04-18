import { Button, Col, Row, Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { Stripe } from '@stripe/stripe-js';
import type { EventDetail } from '@code829/shared/types/event';
import type { TableLock } from '@code829/shared/types/layout';
import type { PricingQuote } from '@code829/shared/types/pricing';
import CheckoutPanel from '../../../components/purchase/CheckoutPanel';

interface GridProps {
  mode: 'grid';
  event: EventDetail;
  tableLocks: TableLock[];
  confirming: boolean;
  setConfirming: (v: boolean) => void;
  error: string | null;
  clientSecret: string | null;
  stripePromise: Promise<Stripe | null> | null;
  quote: PricingQuote | null;
  quoteLoading: boolean;
  quoteError: string | null;
  onPaymentSuccess: () => void;
  onCancel: () => void;
  onExpired: () => void;
}

interface OpenProps {
  mode: 'open';
  event: EventDetail;
  seatCount: number;
  confirming: boolean;
  setConfirming: (v: boolean) => void;
  error: string | null;
  clientSecret: string | null;
  stripePromise: Promise<Stripe | null> | null;
  quote: PricingQuote | null;
  quoteLoading: boolean;
  quoteError: string | null;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

type Props = GridProps | OpenProps;

export default function CheckoutStep(props: Props) {
  const backLabel = props.mode === 'grid' ? 'Back to Table Selection' : 'Back to Seat Selection';

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={props.onCancel}>{backLabel}</Button>
      <Typography.Title level={3}>Complete Your Purchase &mdash; {props.event.title}</Typography.Title>
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} sm={16} md={12} lg={8}>
          {props.mode === 'grid' ? (
            <CheckoutPanel
              mode="grid"
              tableLocks={props.tableLocks}
              confirming={props.confirming}
              setConfirming={props.setConfirming}
              error={props.error}
              clientSecret={props.clientSecret}
              stripePromise={props.stripePromise}
              onPaymentSuccess={props.onPaymentSuccess}
              onCancel={props.onCancel}
              onExpired={props.onExpired}
              quote={props.quote}
              quoteLoading={props.quoteLoading}
              quoteError={props.quoteError}
            />
          ) : (
            <CheckoutPanel
              mode="open"
              seatCount={props.seatCount}
              confirming={props.confirming}
              setConfirming={props.setConfirming}
              error={props.error}
              clientSecret={props.clientSecret}
              stripePromise={props.stripePromise}
              onPaymentSuccess={props.onPaymentSuccess}
              onCancel={props.onCancel}
              quote={props.quote}
              quoteLoading={props.quoteLoading}
              quoteError={props.quoteError}
            />
          )}
        </Col>
      </Row>
    </Space>
  );
}
