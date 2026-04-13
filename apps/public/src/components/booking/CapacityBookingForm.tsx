import { useState } from 'react';
import { Button, Card, InputNumber, Space, Typography, Divider } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { centsToUSD } from '@code829/shared/utils/currency';

interface Props {
  maxCapacity: number;
  totalSold: number;
  pricePerPersonCents: number;
  platformFeeCents: number;
  onProceed: (seats: number) => void;
}

export default function CapacityBookingForm({
  maxCapacity,
  totalSold,
  pricePerPersonCents,
  platformFeeCents,
  onProceed,
}: Props) {
  const [seats, setSeats] = useState(1);

  const available = maxCapacity - totalSold;
  const subtotal = pricePerPersonCents * seats;
  const total = subtotal + platformFeeCents;

  return (
    <Card title="Reserve Seats" styles={{ header: { borderBottom: 'none' } }}>
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
          <TeamOutlined />
          <Typography.Text>{available} of {maxCapacity} seats available</Typography.Text>
        </div>

        <div>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
            Number of Seats
          </Typography.Text>
          <InputNumber
            min={1}
            max={available}
            value={seats}
            onChange={(v: number | null) => setSeats(v ?? 1)}
            style={{ width: '100%' }}
            disabled={available <= 0}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text type="secondary">Price per person</Typography.Text>
          <Typography.Text>{centsToUSD(pricePerPersonCents)}</Typography.Text>
        </div>

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

        <Button
          type="primary"
          size="large"
          block
          onClick={() => onProceed(seats)}
          disabled={available <= 0}
        >
          Proceed to Checkout
        </Button>
      </Space>
    </Card>
  );
}
