import { useState, useCallback } from 'react';
import { Card, Button, Typography, Space, Divider, theme } from 'antd';
import { LockOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import type { EventTableDto, EventTableTypeInfo } from '../../types/event';
import { centsToUSD } from '../../utils/currency';
import TableLockTimer from './TableLockTimer';
import { useHoldTimer } from '../../hooks/useHoldTimer';

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

const SHAPE_RADIUS: Record<string, string> = {
  Round: '50%',
  Cocktail: '50%',
  Square: '4px',
  Rectangle: '6px',
};

/** Inline countdown rendered inside each cell the user has locked */
function CellCountdown({ expiresAt }: { expiresAt: string }) {
  const secondsLeft = useHoldTimer(expiresAt);
  if (secondsLeft <= 0) return null;
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1 }}>
      {m}:{s.toString().padStart(2, '0')}
    </span>
  );
}

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

  const isClickable = useCallback((table: EventTableDto) =>
    table.status === 'Available' || table.status === 'HeldByYou', []);

  const getStatusStyle = useCallback((table: EventTableDto) => {
    const tableColor = table.color ?? 'var(--accent-violet)';

    if (table.isLockedByYou) {
      return {
        bg: tableColor,
        border: token.colorPrimary,
        opacity: 1,
        cursor: 'pointer' as const,
      };
    }
    switch (table.status) {
      case 'Available':
        return { bg: tableColor, border: tableColor, opacity: 1, cursor: 'pointer' as const };
      case 'Held':
        return { bg: tableColor, border: token.colorWarning, opacity: 0.5, cursor: 'not-allowed' as const };
      case 'Booked':
        return { bg: tableColor, border: token.colorTextDisabled, opacity: 0.5, cursor: 'not-allowed' as const };
      default:
        return { bg: tableColor, border: token.colorTextDisabled, opacity: 0.5, cursor: 'not-allowed' as const };
    }
  }, [token]);

  const getTooltip = (table: EventTableDto): string => {
    if (table.isLockedByYou) return `${table.label} — Reserved by you`;
    switch (table.status) {
      case 'Booked': return `${table.label} — Booked`;
      case 'Held': return `${table.label} — Reserved by another guest`;
      default: return `${table.label} — ${table.capacity} seats — ${centsToUSD(table.priceCents)}`;
    }
  };

  // Build cell map
  const cellMap = new Map<string, EventTableDto>();
  for (const t of tables) {
    cellMap.set(`${t.gridRow},${t.gridCol}`, t);
  }

  // Column headers
  const colHeaders: React.ReactNode[] = [<div key="corner" className="ts-header-corner" />];
  for (let c = 0; c < gridCols; c++) {
    colHeaders.push(
      <div key={`col-${c}`} className="ts-col-header">
        {String.fromCharCode(65 + (c % 26))}
      </div>
    );
  }

  // Build rows
  const rows: React.ReactNode[] = [];
  for (let r = 0; r < gridRows; r++) {
    const cells: React.ReactNode[] = [
      <div key={`rh-${r}`} className="ts-row-header">{r + 1}</div>,
    ];

    for (let c = 0; c < gridCols; c++) {
      const key = `${r},${c}`;
      const table = cellMap.get(key);

      if (table) {
        const isSelected = table.id === selectedTableId;
        const isHovered = table.id === hoveredId;
        const clickable = isClickable(table);
        const borderRadius = SHAPE_RADIUS[table.shape] ?? SHAPE_RADIUS.Square;
        const style = getStatusStyle(table);

        cells.push(
          <div key={key} className="ts-cell ts-cell-occupied">
            <div
              role="button"
              tabIndex={clickable ? 0 : -1}
              aria-label={getTooltip(table)}
              title={getTooltip(table)}
              className={`ts-table${isSelected ? ' ts-table-selected' : ''}${!clickable ? ' ts-table-disabled' : ''}`}
              style={{
                '--table-bg': style.bg,
                borderRadius,
                borderColor: style.border,
                opacity: style.opacity,
                cursor: style.cursor,
                boxShadow: isSelected
                  ? `0 0 0 3px ${token.colorPrimaryBorder}`
                  : isHovered && clickable
                    ? `0 0 0 2px ${token.colorPrimaryBgHover}` : 'none',
              } as React.CSSProperties}
              onClick={() => { if (clickable) onSelectTable(table); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && clickable) onSelectTable(table); }}
              onMouseEnter={() => setHoveredId(table.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Status icon overlay */}
              {table.status === 'Booked' && (
                <StopOutlined className="ts-table-icon" />
              )}
              {table.status === 'Held' && !table.isLockedByYou && (
                <LockOutlined className="ts-table-icon" />
              )}
              {table.isLockedByYou && (
                <CheckCircleOutlined className="ts-table-icon ts-table-icon-mine" />
              )}

              <Typography.Text strong className="ts-table-label">
                {table.label}
              </Typography.Text>
              <span className="ts-table-meta">
                {table.capacity}p &middot; {centsToUSD(table.priceCents)}
              </span>

              {/* Inline countdown for user's locked table */}
              {table.isLockedByYou && table.holdExpiresAt && (
                <CellCountdown expiresAt={table.holdExpiresAt} />
              )}
            </div>
          </div>
        );
      } else {
        cells.push(<div key={key} className="ts-cell ts-cell-empty" />);
      }
    }

    rows.push(
      <div key={`row-${r}`} className="ts-grid-row">{cells}</div>
    );
  }

  return (
    <div className="ts-wrapper">
      {/* Status legend */}
      <Space size="large" wrap className="ts-legend">
        <Space size="small">
          <div className="ts-legend-dot" style={{ background: token.colorSuccess }} />
          <Typography.Text type="secondary">Available</Typography.Text>
        </Space>
        <Space size="small">
          <div className="ts-legend-dot" style={{ background: token.colorWarning, opacity: 0.5 }} />
          <Typography.Text type="secondary">Reserved</Typography.Text>
        </Space>
        <Space size="small">
          <div className="ts-legend-dot" style={{ background: token.colorTextDisabled, opacity: 0.5 }} />
          <Typography.Text type="secondary">Booked</Typography.Text>
        </Space>
        <Space size="small">
          <div className="ts-legend-dot" style={{ background: token.colorPrimary }} />
          <Typography.Text type="secondary">Your hold</Typography.Text>
        </Space>
      </Space>

      {/* Pricing legend */}
      {eventTableTypes.length > 0 && (
        <Space size="middle" wrap className="ts-pricing-legend">
          {eventTableTypes.map((ett) => (
            <Space key={ett.id} size="small">
              <div
                className="ts-legend-swatch"
                style={{ background: ett.color ?? 'var(--accent-violet)' }}
              />
              <Typography.Text style={{ fontSize: 12 }}>
                {ett.label} &middot; {ett.capacity}p &middot; {centsToUSD(ett.priceCents)}
              </Typography.Text>
            </Space>
          ))}
        </Space>
      )}

      <Divider style={{ margin: '4px 0' }} />

      <div className="ts-main">
        {/* Grid floor plan */}
        <div className="ts-grid">
          <div className="ts-grid-row ts-header-row">{colHeaders}</div>
          {rows}
        </div>

        {/* Detail panel */}
        {selectedTable && (
          <Card
            size="small"
            title={`Table ${selectedTable.label}`}
            className="ts-detail-card"
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {selectedTable.color && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography.Text type="secondary">Color</Typography.Text>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4,
                    background: selectedTable.color, border: '1px solid var(--border)',
                  }} />
                </div>
              )}
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
                disabled={!isClickable(selectedTable)}
              >
                {selectedTable.isLockedByYou ? 'Proceed to Checkout' : 'Book This Table'}
              </Button>
            </Space>
          </Card>
        )}
      </div>
    </div>
  );
}
