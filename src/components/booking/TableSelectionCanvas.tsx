import { useState } from 'react';
import { Tooltip, Card, Button, Typography, Space, Divider, theme } from 'antd';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { EventTableDto, EventTableTypeInfo } from '../../types/event';
import { centsToUSD } from '../../utils/currency';
import TableLockTimer from './TableLockTimer';

interface Props {
  tables: EventTableDto[];
  eventTableTypes: EventTableTypeInfo[];
  gridRows: number;
  gridCols: number;
  selectedTableId: string | null;
  onSelectTable: (table: EventTableDto) => void;
  onBookTable: (table: EventTableDto) => void;
  lockingTableId: string | null;
}

const SHAPE_STYLES: Record<string, React.CSSProperties> = {
  Round: { borderRadius: '50%' },
  Cocktail: { borderRadius: '50%' },
  Square: { borderRadius: 'var(--border-radius-sm, 4px)' },
  Rectangle: { borderRadius: 'var(--border-radius-sm, 4px)' },
};

export default function TableSelectionCanvas({
  tables,
  eventTableTypes,
  gridRows,
  gridCols,
  selectedTableId,
  onSelectTable,
  onBookTable,
  lockingTableId,
}: Props) {
  const { token } = theme.useToken();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  const getStatusColor = (table: EventTableDto): string => {
    if (table.isLockedByYou) return token.colorPrimary;
    switch (table.status) {
      case 'Available':
        return token.colorSuccess;
      case 'Held':
        return token.colorWarning;
      case 'Booked':
        return token.colorTextDisabled;
      default:
        return token.colorTextDisabled;
    }
  };

  const getStatusBg = (table: EventTableDto): string => {
    if (table.isLockedByYou) return token.colorPrimaryBg;
    switch (table.status) {
      case 'Available':
        return token.colorSuccessBg;
      case 'Held':
        return token.colorWarningBg;
      case 'Booked':
        return token.colorBgContainerDisabled;
      default:
        return token.colorBgContainerDisabled;
    }
  };

  const getTooltip = (table: EventTableDto): string => {
    if (table.isLockedByYou) return `${table.label} - Locked by you`;
    switch (table.status) {
      case 'Booked':
        return `${table.label} - Booked`;
      case 'Held':
        return `${table.label} - Reserved by another guest`;
      default:
        return `${table.label} - ${table.capacity} seats - ${centsToUSD(table.priceCents)}`;
    }
  };

  // Build cell map
  const cellMap = new Map<string, EventTableDto>();
  for (const t of tables) {
    cellMap.set(`${t.gridRow},${t.gridCol}`, t);
  }

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const key = `${r},${c}`;
      const table = cellMap.get(key);

      if (table) {
        const isAvailable = table.status === 'Available';
        const isSelected = table.id === selectedTableId;
        const isHovered = table.id === hoveredId;
        const shapeStyle = SHAPE_STYLES[table.shape] ?? SHAPE_STYLES.Square;
        const statusColor = getStatusColor(table);
        const statusBg = getStatusBg(table);

        cells.push(
          <div key={key} style={{ gridRow: r + 1, gridColumn: c + 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
            <Tooltip title={getTooltip(table)} mouseEnterDelay={0.2}>
              <div
                role="button"
                tabIndex={isAvailable ? 0 : -1}
                aria-label={getTooltip(table)}
                style={{
                  width: '100%',
                  height: '100%',
                  maxWidth: 72,
                  maxHeight: 72,
                  aspectRatio: table.shape === 'Rectangle' ? '1.4 / 1' : '1 / 1',
                  ...shapeStyle,
                  background: statusBg,
                  border: `2px solid ${statusColor}`,
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected
                    ? `0 0 0 3px ${token.colorPrimaryBorder}`
                    : isHovered && isAvailable
                      ? `0 0 0 2px ${token.colorPrimaryBgHover}`
                      : 'none',
                  opacity: table.status === 'Booked' ? 0.6 : 1,
                }}
                onClick={() => {
                  if (isAvailable) onSelectTable(table);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isAvailable) onSelectTable(table);
                }}
                onMouseEnter={() => setHoveredId(table.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <Typography.Text strong style={{ fontSize: 11, lineHeight: 1.2, textAlign: 'center' }}>
                  {table.label}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 9, lineHeight: 1.2 }}>
                  x{table.capacity}
                </Typography.Text>
                {(table.status === 'Booked' || (table.status === 'Held' && !table.isLockedByYou)) && (
                  <LockOutlined style={{ fontSize: 9, opacity: 0.6 }} />
                )}
                {table.isLockedByYou && (
                  <CheckCircleOutlined style={{ fontSize: 9, color: token.colorPrimary }} />
                )}
              </div>
            </Tooltip>
          </div>
        );
      } else {
        cells.push(
          <div key={key} style={{ gridRow: r + 1, gridColumn: c + 1 }} />
        );
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Status legend */}
      <Space size="large" wrap>
        <Space size="small">
          <div style={{ width: 12, height: 12, borderRadius: 2, background: token.colorSuccess }} />
          <Typography.Text type="secondary">Available</Typography.Text>
        </Space>
        <Space size="small">
          <div style={{ width: 12, height: 12, borderRadius: 2, background: token.colorWarning }} />
          <Typography.Text type="secondary">Locked</Typography.Text>
        </Space>
        <Space size="small">
          <div style={{ width: 12, height: 12, borderRadius: 2, background: token.colorTextDisabled }} />
          <Typography.Text type="secondary">Booked</Typography.Text>
        </Space>
      </Space>

      {/* Pricing legend */}
      {eventTableTypes.length > 0 && (
        <Space size="middle" wrap>
          {eventTableTypes.map((ett) => (
            <Space key={ett.id} size="small">
              <div style={{ width: 14, height: 14, borderRadius: 3, background: ett.color ?? 'var(--accent-violet)', border: '1px solid rgba(0,0,0,0.15)' }} />
              <Typography.Text style={{ fontSize: 12 }}>
                {ett.label} · {ett.capacity}p · {centsToUSD(ett.priceCents)}
              </Typography.Text>
            </Space>
          ))}
        </Space>
      )}

      <Divider style={{ margin: '4px 0' }} />

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Grid Canvas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gridTemplateRows: `repeat(${gridRows}, 1fr)`,
            gap: 4,
            width: '100%',
            maxWidth: 600,
            aspectRatio: `${gridCols} / ${gridRows}`,
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
            padding: 8,
            flexShrink: 0,
          }}
        >
          {cells}
        </div>

        {/* Details panel */}
        {selectedTable && (
          <Card
            size="small"
            title={`Table ${selectedTable.label}`}
            style={{ flex: '1 1 240px', minWidth: 240, alignSelf: 'flex-start' }}
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography.Text type="secondary">Type</Typography.Text>
                <Typography.Text>{selectedTable.eventTableLabel}</Typography.Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography.Text type="secondary">Shape</Typography.Text>
                <Typography.Text>{selectedTable.shape}</Typography.Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography.Text type="secondary">Capacity</Typography.Text>
                <Typography.Text>{selectedTable.capacity} seats</Typography.Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography.Text type="secondary">Price</Typography.Text>
                <Typography.Text strong>{centsToUSD(selectedTable.priceCents)}</Typography.Text>
              </div>
              {selectedTable.holdExpiresAt && selectedTable.isLockedByYou && (
                <TableLockTimer expiresAt={selectedTable.holdExpiresAt} />
              )}
              <Button
                type="primary"
                block
                style={{ marginTop: 8 }}
                onClick={() => onBookTable(selectedTable)}
                loading={lockingTableId === selectedTable.id}
              >
                Book This Table
              </Button>
            </Space>
          </Card>
        )}
      </div>
    </div>
  );
}
