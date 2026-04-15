import { Table, Progress, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { centsToUSD } from '@code829/shared/utils/currency';
import type { EventTicketType } from '@code829/shared/types/event';
import HumanCard from '@code829/shared/components/shared/HumanCard';

interface EventTicketTypesTableProps {
  ticketTypes: EventTicketType[];
  loading?: boolean;
}

export default function EventTicketTypesTable({ ticketTypes, loading }: EventTicketTypesTableProps) {
  const columns: ColumnsType<EventTicketType> = [
    {
      title: 'Ticket Tier',
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
        <Tag style={{ color: 'var(--accent-gold)', background: 'color-mix(in srgb, var(--accent-gold) 14%, transparent)', borderColor: 'color-mix(in srgb, var(--accent-gold) 24%, transparent)', fontWeight: 600, borderRadius: 6 }}>
          {centsToUSD(price)}
        </Tag>
      ),
    },
    {
      title: 'Capacity',
      key: 'capacity',
      width: 150,
      render: (_, record) => (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          <strong>{record.soldCount || 0}</strong> / {record.capacity || '∞'}
        </div>
      ),
    },
    {
      title: 'Sales Progress',
      key: 'progress',
      width: 200,
      render: (_, record) => {
        const sold = record.soldCount || 0;
        const total = record.capacity || 0;
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
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const sold = record.soldCount || 0;
        const total = record.capacity || 0;
        const isSoldOut = total > 0 && sold >= total;
        
        return isSoldOut ? (
          <Tag color="error" style={{ borderRadius: 4 }}>Sold Out</Tag>
        ) : (
          <Tag color="success" style={{ borderRadius: 4 }}>Available</Tag>
        );
      },
    },
  ];

  return (
    <HumanCard className="human-noise" style={{ padding: 0, overflow: 'hidden' }}>
      <Table
        dataSource={ticketTypes}
        columns={columns}
        rowKey={(record) => record.id || record.name}
        loading={loading}
        pagination={false}
        size="middle"
        style={{ background: 'transparent' }}
        className="human-table"
      />
    </HumanCard>
  );
}
