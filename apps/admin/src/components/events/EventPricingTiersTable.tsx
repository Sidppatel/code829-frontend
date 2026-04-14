import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { centsToUSD } from '@code829/shared/utils/currency';

export interface PricingRow {
  id?: string;
  name: string;
  priceCents: number;
  platformFeeCents?: number | null;
  soldCount: number;
  capacity: number | null;
  description?: string;
}

interface EventPricingTiersTableProps {
  tiers: PricingRow[];
  loading?: boolean;
  defaultPlatformFeeCents?: number;
}

export default function EventPricingTiersTable({ tiers, loading, defaultPlatformFeeCents = 0 }: EventPricingTiersTableProps) {
  const columns: ColumnsType<PricingRow> = [
    {
      title: 'Ticket Tier',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: PricingRow) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{name}</div>
          {record.description && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'priceCents',
      key: 'price',
      width: 110,
      render: (price: number) => (
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{centsToUSD(price)}</span>
      ),
    },
    {
      title: 'Platform Fee',
      key: 'fee',
      width: 120,
      render: (_: unknown, record: PricingRow) => {
        const fee = record.platformFeeCents ?? defaultPlatformFeeCents;
        return (
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
            {fee > 0 ? centsToUSD(fee) : '—'}
            {record.platformFeeCents != null && (
              <Tag color="blue" style={{ marginLeft: 6, fontSize: 10, borderRadius: 4, padding: '0 4px' }}>Custom</Tag>
            )}
          </span>
        );
      },
    },
    {
      title: 'Total',
      key: 'total',
      width: 120,
      render: (_: unknown, record: PricingRow) => {
        const fee = record.platformFeeCents ?? defaultPlatformFeeCents;
        const total = record.priceCents + fee;
        return (
          <Tag color="gold" style={{ fontWeight: 700, borderRadius: 6, fontSize: 13 }}>
            {centsToUSD(total)}
          </Tag>
        );
      },
    },
    {
      title: 'Sold / Capacity',
      key: 'capacity',
      width: 140,
      render: (_: unknown, record: PricingRow) => (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          <strong>{record.soldCount}</strong> / {record.capacity != null && record.capacity > 0 ? record.capacity : '∞'}
        </div>
      ),
    },
  ];

  return (
    <div style={{
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid var(--border-soft)',
      background: 'rgba(255,255,255,0.02)',
      padding: '12px'
    }}>
      <Table
        dataSource={tiers}
        columns={columns}
        rowKey={(record, index) => record.id || `${record.name}-${index}`}
        loading={loading}
        pagination={false}
        size="middle"
        style={{ background: 'transparent' }}
        className="human-table-compact"
      />
    </div>
  );
}
