import { Button, Card, Descriptions, Divider, Typography, Space } from 'antd';
import { centsToUSD } from '../../utils/currency';
import type { TableLock } from '../../types/layout';
import type { TicketType } from '../../types/event';
import TableLockTimer from './TableLockTimer';

interface Props {
  tableLock: TableLock;
  ticketType: TicketType;
  confirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onExpired: () => void;
}

export default function CheckoutPanel({
  tableLock,
  ticketType,
  confirming,
  onConfirm,
  onCancel,
  onExpired,
}: Props) {
  const price = tableLock.priceCents;
  const fee = tableLock.platformFeeCents;
  const isPerTable = tableLock.priceType === 'PerTable';
  const subtotal = isPerTable ? price : price * tableLock.capacity;
  const totalFee = isPerTable ? fee : fee * tableLock.capacity;
  const total = subtotal + totalFee;

  return (
    <Card title="Checkout" styles={{ header: { borderBottom: 'none' } }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <TableLockTimer expiresAt={tableLock.expiresAt} onExpired={onExpired} />

        <Descriptions column={1} size="small">
          <Descriptions.Item label="Table">{tableLock.tableLabel}</Descriptions.Item>
          <Descriptions.Item label="Seats">{tableLock.capacity}</Descriptions.Item>
          <Descriptions.Item label="Ticket Type">{ticketType.name}</Descriptions.Item>
          <Descriptions.Item label="Pricing">
            {isPerTable ? 'Per Table' : `${centsToUSD(price)} per seat`}
          </Descriptions.Item>
        </Descriptions>

        <Divider style={{ margin: '8px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text>Subtotal</Typography.Text>
          <Typography.Text>{centsToUSD(subtotal)}</Typography.Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text type="secondary">Platform Fee</Typography.Text>
          <Typography.Text type="secondary">{centsToUSD(totalFee)}</Typography.Text>
        </div>
        <Divider style={{ margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text strong>Total</Typography.Text>
          <Typography.Text strong style={{ fontSize: 18 }}>{centsToUSD(total)}</Typography.Text>
        </div>

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
