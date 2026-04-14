import { Table, Progress, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { centsToUSD } from '@code829/shared/utils/currency';
import type { EventPricingTier } from '@code829/shared/types/event';
import HumanCard from '@code829/shared/components/shared/HumanCard';

interface EventPricingTiersTableProps {
  tiers: EventPricingTier[];
  loading?: boolean;
  layoutMode: 'Grid' | 'Open';
}

export default function EventPricingTiersTable({ tiers, loading, layoutMode }: EventPricingTiersTableProps) {
  const columns: ColumnsType<EventPricingTier> = [
    {
      title: layoutMode === 'Grid' ? 'Table Type' : 'Ticket Tier',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          {name}
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'priceCents',
      key: 'price',
      width: 120,
      render: (price: number) => (
        <Tag color="gold" style={{ fontWeight: 600, borderRadius: 6 }}>
          {centsToUSD(price)}
        </Tag>
      ),
    },
    {
      title: layoutMode === 'Grid' ? 'Max Capacity' : 'Sold / Capacity',
      key: 'capacity',
      width: 200,
      render: (_, record) => {
        if (layoutMode === 'Grid') {
          return (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                {record.totalCapacity ?? 0} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>people</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {record.capacity || 0} seats × {record.count} tables
              </div>
            </div>
          );
        }
        return (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            <strong>{record.soldCount || 0}</strong> / {record.totalCapacity != null && record.totalCapacity > 0 ? record.totalCapacity : '∞'}
          </div>
        );
      },
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
