import { Button, Col, Row, Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { Stripe } from '@stripe/stripe-js';
import type { EventDetail } from '@code829/shared/types/event';
import type { TableLock } from '@code829/shared/types/layout';
import CheckoutPanel from '../../../components/booking/CheckoutPanel';

interface GridProps {
  mode: 'grid';
  event: EventDetail;
  tableLocks: TableLock[];
  confirming: boolean;
  setConfirming: (v: boolean) => void;
  error: string | null;
  clientSecret: string | null;
  stripePromise: Promise<Stripe | null> | null;
  taxAmountCents: number | null;
  onPaymentSuccess: () => void;
  onCancel: () => void;
  onExpired: () => void;
}

interface OpenProps {
  mode: 'open';
  event: EventDetail;
  seatCount: number;
  pricePerPersonCents: number;
  confirming: boolean;
  setConfirming: (v: boolean) => void;
  error: string | null;
  clientSecret: string | null;
  stripePromise: Promise<Stripe | null> | null;
  taxAmountCents: number | null;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

type Props = GridProps | OpenProps;

export default function CheckoutStep(props: Props) {
  const backLabel = props.mode === 'grid' ? 'Back to Table Selection' : 'Back to Seat Selection';

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={props.onCancel}>{backLabel}</Button>
      <Typography.Title level={3}>Complete Your Booking &mdash; {props.event.title}</Typography.Title>
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
              taxAmountCents={props.taxAmountCents}
            />
          ) : (
            <CheckoutPanel
              mode="open"
              seatCount={props.seatCount}
              pricePerPersonCents={props.pricePerPersonCents}
              confirming={props.confirming}
              setConfirming={props.setConfirming}
              error={props.error}
              clientSecret={props.clientSecret}
              stripePromise={props.stripePromise}
              onPaymentSuccess={props.onPaymentSuccess}
              onCancel={props.onCancel}
              taxAmountCents={props.taxAmountCents}
            />
          )}
        </Col>
      </Row>
    </Space>
  );
}
