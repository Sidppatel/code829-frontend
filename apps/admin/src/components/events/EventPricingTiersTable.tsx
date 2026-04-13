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
      title: layoutMode === 'Grid' ? 'Capacity / Count' : 'SoldCount / Capacity',
      key: 'capacity',
      width: 180,
      render: (_, record) => {
        if (layoutMode === 'Grid') {
          return (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <strong>{record.capacity || 0}</strong> seats × <strong>{record.count}</strong> tables
            </div>
          );
        }
        return (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            <strong>{record.soldCount || 0}</strong> / {record.capacity && record.capacity > 0 ? record.capacity : '∞'}
          </div>
        );
      },
    },
    {
      title: 'Sales Status',
      key: 'progress',
      width: 200,
      render: (_, record) => {
        const sold = record.soldCount || 0;
        const total = record.capacity || 0;
        
        if (layoutMode === 'Open') {
          const percent = total > 0 ? Math.round((sold / total) * 100) : 0;
          return (
            <div style={{ minWidth: 120 }}>
              <Progress 
                percent={percent} 
                size="small" 
                strokeColor="var(--primary)" 
                trailColor="var(--bg-soft)"
                format={(p) => <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{p}%</span>}
              />
            </div>
          );
        }

        // For Grid events, "sold" means booked tables
        const percent = record.count > 0 ? Math.round((sold / record.count) * 100) : 0;
        return (
          <div style={{ minWidth: 120 }}>
            <Progress 
              percent={percent} 
              size="small" 
              strokeColor="var(--primary)" 
              trailColor="var(--bg-soft)"
              format={(p) => <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{p}% booked</span>}
            />
          </div>
        );
      },
    },
  ];

  return (
    <HumanCard className="human-noise" style={{ padding: 0, overflow: 'hidden' }}>
      <Table
        dataSource={tiers}
        columns={columns}
        rowKey={(record) => record.name}
        loading={loading}
        pagination={false}
        size="middle"
        style={{ background: 'transparent' }}
        className="human-table"
      />
    </HumanCard>
  );
}
