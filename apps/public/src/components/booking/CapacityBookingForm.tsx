import { useState } from 'react';
import { Button, Card, InputNumber, Space, Typography, Divider, Radio } from 'antd';
import { TeamOutlined, TagOutlined } from '@ant-design/icons';
import { centsToUSD } from '@code829/shared/utils/currency';
import type { EventTicketType } from '@code829/shared/types/event';

interface Props {
  maxCapacity: number;
  totalSold: number;
  pricePerPersonCents: number;
  ticketTypes?: EventTicketType[];
  onProceed: (seats: number, ticketTypeId?: string) => void;
}

export default function CapacityBookingForm({
  maxCapacity,
  totalSold,
  pricePerPersonCents,
  ticketTypes,
  onProceed,
}: Props) {
  const [seats, setSeats] = useState(1);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string | undefined>(
    ticketTypes && ticketTypes.length > 0 ? ticketTypes[0].id : undefined
  );

  const hasTicketTypes = ticketTypes && ticketTypes.length > 0;
  const selectedType = hasTicketTypes
    ? ticketTypes.find(tt => tt.id === selectedTicketTypeId)
    : undefined;

  const priceCents = selectedType?.displayPriceCents ?? pricePerPersonCents;
  const available = selectedType
    ? selectedType.availableCount
    : maxCapacity - totalSold;
  const total = priceCents * seats;

  return (
    <Card title="Reserve Seats" styles={{ header: { borderBottom: 'none' } }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {hasTicketTypes ? (
          <>
            <div style={{ marginBottom: 4 }}>
              <Typography.Text type="secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <TagOutlined /> Select Ticket Type
              </Typography.Text>
              <Radio.Group
                value={selectedTicketTypeId}
                onChange={(e) => {
                  setSelectedTicketTypeId(e.target.value);
                  setSeats(1);
                }}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {ticketTypes.map(tt => (
                    <Radio
                      key={tt.id}
                      value={tt.id}
                      disabled={tt.availableCount <= 0}
                      style={{ width: '100%', padding: '12px 0', minHeight: 44 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', minWidth: 200 }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{tt.label}</div>
                          {tt.description && (
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              {tt.description}
                            </Typography.Text>
                          )}
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {tt.availableCount > 0
                              ? `${tt.availableCount} available`
                              : 'Sold out'}
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 16 }}>
                          {centsToUSD(tt.displayPriceCents)}
                        </div>
                      </div>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>
            <Divider style={{ margin: '4px 0' }} />
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
            <TeamOutlined />
            <Typography.Text>{available} of {maxCapacity} seats available</Typography.Text>
          </div>
        )}

        <div>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
            Number of Seats
          </Typography.Text>
          <InputNumber
            min={1}
            max={available}
            value={seats}
            onChange={(v: number | null) => setSeats(v ?? 1)}
            size="large"
            style={{ width: '100%', minHeight: 44 }}
            disabled={available <= 0}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text type="secondary">Price per person</Typography.Text>
          <Typography.Text>{centsToUSD(priceCents)}</Typography.Text>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text strong>Total</Typography.Text>
          <Typography.Text strong style={{ fontSize: 18 }}>{centsToUSD(total)}</Typography.Text>
        </div>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          + applicable taxes at checkout
        </Typography.Text>

        <Button
          type="primary"
          size="large"
          block
          onClick={() => onProceed(seats, selectedTicketTypeId)}
          disabled={available <= 0}
          style={{ minHeight: 48 }}
        >
          Proceed to Checkout
        </Button>
      </Space>
    </Card>
  );
}
