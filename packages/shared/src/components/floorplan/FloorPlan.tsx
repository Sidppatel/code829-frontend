/**
 * Unified floor plan — single component serves both the admin layout editor
 * and the public booking table selector.
 *
 *   mode="edit"    admin places/removes tables, tier-colors them
 *   mode="select"  public clicks tables to lock/unlock
 *   mode="display" read-only preview
 *
 * The grid shape (rows × cols), cell coordinates (gridRow, gridCol, 0-based),
 * and shape → radius mapping are identical between admin and public by design
 * — this component owns those.
 */
import { useMemo, useState } from 'react';
import { Spin } from 'antd';
import { LockOutlined, CheckCircleOutlined, StopOutlined, LoadingOutlined } from '@ant-design/icons';
import type { EventTableDto, EventTableTypeInfo } from '../../types/event';
import { useHoldTimer } from '../../hooks/useHoldTimer';

export type FloorPlanMode = 'edit' | 'select' | 'display';

const SHAPE_RADIUS: Record<string, string> = {
  Round: '50%',
  Cocktail: '50%',
  Square: '4px',
  Rectangle: '6px',
};

function colLetter(col: number): string {
  return String.fromCharCode(65 + (col % 26));
}

function labelFor(table: Pick<EventTableDto, 'label' | 'gridRow' | 'gridCol'>): string {
  return table.label || `${colLetter(table.gridCol)}${table.gridRow + 1}`;
}

type EditCallbacks = {
  mode: 'edit';
  activeTierId?: string;
  onCellAdd: (gridRow: number, gridCol: number) => void;
  onTableRemove: (table: EventTableDto) => void;
};

type SelectCallbacks = {
  mode: 'select';
  lockingTableId?: string | null;
  onLockTable: (table: EventTableDto) => void;
  onUnlockTable: (table: EventTableDto) => void;
};

type DisplayCallbacks = {
  mode: 'display';
};

type ModeProps = EditCallbacks | SelectCallbacks | DisplayCallbacks;

type Props = {
  tables: EventTableDto[];
  gridRows: number;
  gridCols: number;
  tierTypes?: EventTableTypeInfo[];
} & ModeProps;

/** Inline countdown for user-locked cells (select mode only) */
function CellCountdown({ expiresAt }: { expiresAt: string }) {
  const secondsLeft = useHoldTimer(expiresAt);
  if (secondsLeft <= 0) return null;
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        lineHeight: 1,
        color: secondsLeft <= 60 ? 'var(--status-danger)' : 'var(--status-warning)',
      }}
    >
      {m}:{s.toString().padStart(2, '0')}
    </span>
  );
}

export default function FloorPlan(props: Props) {
  const { tables, gridRows, gridCols } = props;
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const cellMap = useMemo(() => {
    const m = new Map<string, EventTableDto>();
    for (const t of tables) m.set(`${t.gridRow},${t.gridCol}`, t);
    return m;
  }, [tables]);

  const renderCell = (r: number, c: number) => {
    const key = `${r},${c}`;
    const table = cellMap.get(key);

    if (!table) {
      // Empty cell — clickable only in edit mode
      if (props.mode === 'edit') {
        return (
          <button
            type="button"
            key={key}
            className="ts-cell ts-cell-empty"
            onClick={() => props.onCellAdd(r, c)}
            aria-label={`Add table at ${colLetter(c)}${r + 1}`}
            style={{
              background: 'transparent',
              cursor: 'pointer',
            }}
          />
        );
      }
      return <div key={key} className="ts-cell ts-cell-empty" />;
    }

    return renderTable(table, r, c);
  };

  const renderTable = (table: EventTableDto, r: number, c: number) => {
    const key = `${r},${c}`;
    const borderRadius = SHAPE_RADIUS[table.shape] ?? SHAPE_RADIUS.Square;
    const tableColor = table.color ?? 'var(--primary)';
    const isHovered = hoveredId === table.id;
    const tooltip = `${labelFor(table)} · ${table.capacity} seats`;

    // Edit mode: click to remove
    if (props.mode === 'edit') {
      return (
        <div key={key} className="ts-cell ts-cell-occupied">
          <button
            type="button"
            className="ts-table"
            onClick={() => props.onTableRemove(table)}
            onMouseEnter={() => setHoveredId(table.id)}
            onMouseLeave={() => setHoveredId(null)}
            title={`${tooltip} — click to remove`}
            style={{
              ['--table-bg' as string]: tableColor,
              borderRadius,
              borderColor: tableColor,
              cursor: 'pointer',
              boxShadow: isHovered ? '0 0 0 2px var(--status-danger)' : 'none',
            }}
          >
            <span className="ts-table-label">{labelFor(table)}</span>
            <span className="ts-table-meta">{table.capacity}p</span>
          </button>
        </div>
      );
    }

    // Display mode: no interaction
    if (props.mode === 'display') {
      return (
        <div key={key} className="ts-cell ts-cell-occupied">
          <div
            className="ts-table"
            style={{
              ['--table-bg' as string]: tableColor,
              borderRadius,
              borderColor: tableColor,
              cursor: 'default',
            }}
          >
            <span className="ts-table-label">{labelFor(table)}</span>
            <span className="ts-table-meta">{table.capacity}p</span>
          </div>
        </div>
      );
    }

    // Select mode: public booking
    const { lockingTableId, onLockTable, onUnlockTable } = props;
    const isLocking = table.id === lockingTableId;
    const isUserLocked = table.isLockedByYou;
    const clickable = table.status === 'Available' || isUserLocked;

    const bg = tableColor;
    let border = tableColor;
    let opacity = 1;
    let cursor: 'pointer' | 'wait' | 'not-allowed' = clickable ? 'pointer' : 'not-allowed';
    if (isLocking) cursor = 'wait';

    if (isUserLocked) {
      border = 'var(--primary)';
    } else if (table.status === 'Held') {
      border = 'var(--status-warning)';
      opacity = 0.5;
    } else if (table.status === 'Booked') {
      border = 'var(--status-neutral)';
      opacity = 0.5;
    }

    const onClick = () => {
      if (!clickable || isLocking) return;
      if (isUserLocked) onUnlockTable(table);
      else onLockTable(table);
    };

    return (
      <div key={key} className="ts-cell ts-cell-occupied">
        <div
          role="button"
          tabIndex={clickable ? 0 : -1}
          aria-label={tooltip}
          title={tooltip}
          className={`ts-table${isUserLocked ? ' ts-table-selected' : ''}${
            !clickable ? ' ts-table-disabled' : ''
          }`}
          style={{
            ['--table-bg' as string]: bg,
            borderRadius,
            borderColor: border,
            opacity: isLocking ? 0.7 : opacity,
            cursor,
            boxShadow: isUserLocked
              ? '0 0 0 3px var(--primary-muted)'
              : isHovered && clickable
                ? '0 0 0 2px var(--primary-light)'
                : 'none',
          }}
          onClick={onClick}
          onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
          onMouseEnter={() => setHoveredId(table.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          {isLocking && (
            <Spin
              indicator={
                <LoadingOutlined style={{ fontSize: 14, color: 'var(--text-on-brand)' }} />
              }
            />
          )}
          {!isLocking && table.status === 'Booked' && (
            <StopOutlined className="ts-table-icon" />
          )}
          {!isLocking && table.status === 'Held' && !isUserLocked && (
            <LockOutlined className="ts-table-icon" />
          )}
          {!isLocking && isUserLocked && (
            <CheckCircleOutlined className="ts-table-icon ts-table-icon-mine" />
          )}
          <span className="ts-table-label">{labelFor(table)}</span>
          <span className="ts-table-meta">{table.capacity}p</span>
          {isUserLocked && table.holdExpiresAt && (
            <CellCountdown expiresAt={table.holdExpiresAt} />
          )}
        </div>
      </div>
    );
  };

  // Column headers (A, B, C, …)
  const colHeaders = [
    <div key="corner" className="ts-header-corner" />,
    ...Array.from({ length: gridCols }, (_, c) => (
      <div key={`col-${c}`} className="ts-col-header">
        {colLetter(c)}
      </div>
    )),
  ];

  // Rows
  const rows = Array.from({ length: gridRows }, (_, r) => (
    <div key={`row-${r}`} className="ts-grid-row">
      <div className="ts-row-header">{r + 1}</div>
      {Array.from({ length: gridCols }, (_, c) => renderCell(r, c))}
    </div>
  ));

  return (
    <div
      className="ts-grid"
      role="grid"
      aria-label="Floor plan"
      style={{ minHeight: 0 }}
    >
      <div className="ts-grid-row ts-header-row">{colHeaders}</div>
      {rows}
    </div>
  );
}

export { labelFor as floorPlanLabelFor };
