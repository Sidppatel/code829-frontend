import { useMemo } from 'react';
import { Card, Button, Typography, Space, Divider } from 'antd';
import type { EventTableDto, EventTableTypeInfo } from '@code829/shared/types/event';
import { centsToUSD } from '@code829/shared/utils/currency';
import {
  FloorPlan,
  TierLegend,
  floorPlanLabelFor,
} from '@code829/shared/components/floorplan';
import {
  LockOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import TableLockTimer from './TableLockTimer';
import { usePurchaseQuote } from '@code829/shared/hooks/usePurchaseQuote';

interface Props {
  eventId: string;
  tables: EventTableDto[];
  eventTableTypes: EventTableTypeInfo[];
  gridRows: number;
  gridCols: number;
  lockedTables: EventTableDto[];
  onLockTable: (table: EventTableDto) => void;
  onUnlockTable: (table: EventTableDto) => void;
  onProceedToCheckout: () => void;
  lockingTableId: string | null;
  onLockExpired: () => void;
}

function StatusLegendItem({
  status,
  label,
  icon: Icon,
  isMine = false,
}: {
  status: 'available' | 'reserved' | 'booked';
  label: string;
  icon?: any;
  isMine?: boolean;
}) {
  const statusClass = isMine ? 'ts-table-mine' : `ts-table-${status}`;

  return (
    <Space size="small">
      <div
        className={`ts-table ${statusClass}`}
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          flexShrink: 0,
          ['--table-bg' as string]: isMine
            ? 'var(--primary)'
            : status === 'available'
              ? 'transparent'
              : 'var(--bg-muted)',
          borderColor: status === 'available' ? 'var(--border-strong)' : undefined,
        }}
      >
        {Icon && (
          <Icon
            style={{
              fontSize: 10,
              color: 'var(--text-on-brand)',
              position: 'relative',
              zIndex: 3,
            }}
          />
        )}
      </div>
      <Typography.Text type="secondary">{label}</Typography.Text>
    </Space>
  );
}

export default function TableSelectionCanvas({
  eventId,
  tables,
  eventTableTypes,
  gridRows,
  gridCols,
  lockedTables,
  onLockTable,
  onUnlockTable,
  onProceedToCheckout,
  lockingTableId,
  onLockExpired,
}: Props) {

  const quoteSelection = useMemo(
    () =>
      lockedTables.length > 0
        ? { eventId, tableIds: lockedTables.map((t) => t.id) }
        : null,
    [eventId, lockedTables],
  );
  const { quote } = usePurchaseQuote(quoteSelection);

  return (
    <div className="ts-wrapper">
      {/* Status legend */}
      <Space size="large" wrap className="ts-legend">
        <StatusLegendItem status="available" label="Available" />
        <StatusLegendItem status="reserved" label="Reserved" icon={LockOutlined} />
        <StatusLegendItem status="booked" label="Booked" icon={StopOutlined} />
        <StatusLegendItem status="booked" label="Your hold" icon={CheckCircleOutlined} isMine />
      </Space>

      {/* Pricing legend */}
      {eventTableTypes.length > 0 && (
        <div className="ts-pricing-legend">
          <TierLegend tiers={eventTableTypes} />
        </div>
      )}

      <Divider style={{ margin: '4px 0' }} />

      <div className="ts-main">
        <FloorPlan
          mode="select"
          tables={tables}
          tierTypes={eventTableTypes}
          gridRows={gridRows}
          gridCols={gridCols}
          lockingTableId={lockingTableId}
          onLockTable={onLockTable}
          onUnlockTable={onUnlockTable}
        />

        {lockedTables.length > 0 && (() => {
          const labels = lockedTables.map(floorPlanLabelFor).join(', ');
          const earliestExpiry = lockedTables
            .map((t) => t.holdExpiresAt)
            .filter(Boolean)
            .sort()[0];

          const groups = new Map<string, EventTableDto[]>();
          for (const t of lockedTables) {
            const key = t.eventTableLabel ?? 'Table';
            groups.set(key, [...(groups.get(key) ?? []), t]);
          }

          return (
            <Card
              size="small"
              title={`${lockedTables.length} Table${lockedTables.length > 1 ? 's' : ''
                } Selected — ${labels}`}
              className="ts-detail-card"
            >
              <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                {earliestExpiry && (
                  <TableLockTimer expiresAt={earliestExpiry} onExpired={onLockExpired} />
                )}
                {[...groups.entries()].map(([typeLabel, groupTables]) => (
                  <div key={typeLabel} style={{ padding: '4px 0' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography.Text strong>{typeLabel}</Typography.Text>
                      {groupTables[0].color && (
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 3,
                            background: groupTables[0].color,
                            border: '1px solid var(--border)',
                          }}
                        />
                      )}
                    </div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {groupTables[0].shape} ·{' '}
                      {groupTables.length} × {centsToUSD(groupTables[0].displayPriceCents)}
                    </Typography.Text>
                  </div>
                ))}
                <Divider style={{ margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography.Text type="secondary">Total seats</Typography.Text>
                  <Typography.Text>{quote?.seatsIncluded ?? '—'}</Typography.Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography.Text type="secondary">Total price</Typography.Text>
                  <Typography.Text strong>
                    {quote ? centsToUSD(quote.displaySubtotalCents) : '—'}
                  </Typography.Text>
                </div>
                <Button
                  type="primary"
                  block
                  style={{ marginTop: 8 }}
                  onClick={onProceedToCheckout}
                >
                  Proceed to Checkout
                </Button>
              </Space>
            </Card>
          );
        })()}
      </div>
    </div>
  );
}
