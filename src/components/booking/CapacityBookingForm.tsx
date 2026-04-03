import { useState } from 'react';
import { Button, Card, InputNumber, Select, Space, Typography, Divider, App } from 'antd';
import type { TicketType } from '../../types/event';
import { centsToUSD } from '../../utils/currency';
import { bookingsApi } from '../../services/bookingsApi';

interface Props {
  eventId: string;
  maxCapacity: number;
  ticketTypes: TicketType[];
  onBookingCreated: (bookingId: string) => void;
}

export default function CapacityBookingForm({ eventId, maxCapacity, ticketTypes, onBookingCreated }: Props) {
  const [seats, setSeats] = useState(1);
  const [ticketTypeId, setTicketTypeId] = useState<string>(ticketTypes[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const selectedType = ticketTypes.find((t) => t.id === ticketTypeId);
  const price = selectedType?.priceCents ?? 0;
  const fee = selectedType?.platformFeeCents ?? 0;
  const subtotal = price * seats;
  const totalFee = fee * seats;
  const total = subtotal + totalFee;

  const handleBook = async () => {
    if (!ticketTypeId) return;
    setLoading(true);
    try {
      const { data } = await bookingsApi.createCapacityBooking({
        eventId,
        ticketTypeId,
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
        <div>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
            Ticket Type
          </Typography.Text>
          <Select
            value={ticketTypeId}
            onChange={setTicketTypeId}
            style={{ width: '100%' }}
            options={ticketTypes.map((t) => ({
              value: t.id,
              label: `${t.name} — ${centsToUSD(t.priceCents)}`,
            }))}
          />
        </div>

        <div>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
            Number of Seats (max {maxCapacity})
          </Typography.Text>
          <InputNumber
            min={1}
            max={maxCapacity}
            value={seats}
            onChange={(v) => setSeats(v ?? 1)}
            style={{ width: '100%' }}
          />
        </div>

        <Divider style={{ margin: '8px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text>Subtotal</Typography.Text>
          <Typography.Text>{centsToUSD(subtotal)}</Typography.Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text type="secondary">Fee</Typography.Text>
          <Typography.Text type="secondary">{centsToUSD(totalFee)}</Typography.Text>
        </div>
        <Divider style={{ margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text strong>Total</Typography.Text>
          <Typography.Text strong style={{ fontSize: 18 }}>{centsToUSD(total)}</Typography.Text>
        </div>

        <Button type="primary" size="large" block onClick={handleBook} loading={loading} disabled={!ticketTypeId}>
          Book {seats} {seats === 1 ? 'Seat' : 'Seats'}
        </Button>
      </Space>
    </Card>
  );
}
