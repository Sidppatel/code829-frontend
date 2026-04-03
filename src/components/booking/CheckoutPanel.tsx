import { Button, Card, Descriptions, Divider, Typography, Space, Alert } from 'antd';
import { centsToUSD } from '../../utils/currency';
import type { TableLock } from '../../types/layout';
import TableLockTimer from './TableLockTimer';

interface GridCheckoutProps {
  mode: 'grid';
  tableLock: TableLock;
  platformFeePercent: number;
  confirming: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  onExpired: () => void;
}

interface OpenCheckoutProps {
  mode: 'open';
  seatCount: number;
  pricePerPersonCents: number;
  platformFeePercent: number;
  confirming: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

type Props = GridCheckoutProps | OpenCheckoutProps;

export default function CheckoutPanel(props: Props) {
  const { mode, platformFeePercent, confirming, error, onConfirm, onCancel } = props;

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

  const feeCents = Math.round(subtotal * (platformFeePercent / 100));
  const total = subtotal + feeCents;

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
          <Typography.Text type="secondary">
            Platform Fee ({platformFeePercent}%)
          </Typography.Text>
          <Typography.Text type="secondary">{centsToUSD(feeCents)}</Typography.Text>
        </div>
        <Divider style={{ margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text strong>Total</Typography.Text>
          <Typography.Text strong style={{ fontSize: 18 }}>{centsToUSD(total)}</Typography.Text>
        </div>

        {error && (
          <Alert type="error" message={error} showIcon />
        )}

        <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 8 }}>
          <Button type="primary" size="large" block onClick={onConfirm} loading={confirming}>
            Confirm & Pay
          </Button>
          <Button block onClick={onCancel}>
            Cancel
          </Button>
        </Space>
      </Space>
    </Card>
  );
}
