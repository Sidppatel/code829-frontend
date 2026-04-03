import { useState } from 'react';
import { Button, Card, InputNumber, Space, Typography, Divider, App } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { centsToUSD } from '../../utils/currency';
import { bookingsApi } from '../../services/bookingsApi';

interface Props {
  eventId: string;
  maxCapacity: number;
  totalSold: number;
  pricePerPersonCents: number;
  platformFeePercent: number;
  onBookingCreated: (bookingId: string) => void;
}

export default function CapacityBookingForm({
  eventId,
  maxCapacity,
  totalSold,
  pricePerPersonCents,
  platformFeePercent,
  onBookingCreated,
}: Props) {
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const available = maxCapacity - totalSold;
  const subtotal = pricePerPersonCents * seats;
  const feeCents = Math.round(subtotal * (platformFeePercent / 100));
  const total = subtotal + feeCents;

  const handleBook = async () => {
    setLoading(true);
    try {
      const { data } = await bookingsApi.create({
        eventId,
        seatsReserved: seats,
      });
      message.success('Booking created');
      onBookingCreated(data.id);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      message.error(axiosErr?.response?.data?.message ?? 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Reserve Seats" styles={{ header: { borderBottom: 'none' } }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 'var(--border-radius-sm, 6px)',
          }}
        >
          <TeamOutlined />
          <Typography.Text>
            {available} of {maxCapacity} seats available
          </Typography.Text>
        </div>

        <div>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
            Number of Seats
          </Typography.Text>
          <InputNumber
            min={1}
            max={available}
            value={seats}
            onChange={(v) => setSeats(v ?? 1)}
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
          <Typography.Text type="secondary">Platform Fee ({platformFeePercent}%)</Typography.Text>
          <Typography.Text type="secondary">{centsToUSD(feeCents)}</Typography.Text>
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
          onClick={handleBook}
          loading={loading}
          disabled={available <= 0}
        >
          Book {seats} {seats === 1 ? 'Seat' : 'Seats'}
        </Button>
      </Space>
    </Card>
  );
}
