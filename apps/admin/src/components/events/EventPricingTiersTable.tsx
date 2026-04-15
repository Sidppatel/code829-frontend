import { Table, Tag, Grid } from 'antd';
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

const { useBreakpoint } = Grid;

function MobileCard({ row, defaultFee }: { row: PricingRow; defaultFee: number }) {
  const fee = row.platformFeeCents ?? defaultFee;
  const total = row.priceCents + fee;
  const cap = row.capacity != null && row.capacity > 0 ? row.capacity : '∞';

  return (
    <div style={{
      padding: 16,
      borderRadius: 12,
      border: '1px solid var(--border)',
      background: 'var(--bg-surface)',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{row.name}</div>
          {row.description && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.description}</div>
          )}
        </div>
        <Tag style={{ color: 'var(--accent-gold)', background: 'color-mix(in srgb, var(--accent-gold) 14%, transparent)', borderColor: 'color-mix(in srgb, var(--accent-gold) 24%, transparent)', fontWeight: 700, borderRadius: 6, fontSize: 13, marginLeft: 8, flexShrink: 0 }}>
          {centsToUSD(total)}
        </Tag>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Price</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{centsToUSD(row.priceCents)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Fee</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{fee > 0 ? centsToUSD(fee) : '—'}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sold</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            <strong>{row.soldCount}</strong> / {cap}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventPricingTiersTable({ tiers, loading, defaultPlatformFeeCents = 0 }: EventPricingTiersTableProps) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  if (isMobile) {
    return (
      <div>
        {tiers.map((row, i) => (
          <MobileCard key={row.id || `${row.name}-${i}`} row={row} defaultFee={defaultPlatformFeeCents} />
        ))}
      </div>
    );
  }

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
          <Tag style={{ color: 'var(--accent-gold)', background: 'color-mix(in srgb, var(--accent-gold) 14%, transparent)', borderColor: 'color-mix(in srgb, var(--accent-gold) 24%, transparent)', fontWeight: 700, borderRadius: 6, fontSize: 13 }}>
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
      border: '1px solid var(--border)',
      background: 'var(--bg-surface)',
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
