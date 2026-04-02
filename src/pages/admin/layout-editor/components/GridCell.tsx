import { Tooltip } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import type { FloorPlanElement } from '../../../../stores/floorPlanStore';
import type { TableStatusInfo } from '../../../../types/layout';

interface GridCellProps {
  row: number;
  col: number;
  element: FloorPlanElement | null;
  statusInfo: TableStatusInfo | null;
  isLocked: boolean;
  isSelected: boolean;
  hasBrush: boolean;
  onClick: () => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function GridCell({
  element,
  statusInfo,
  isLocked,
  isSelected,
  hasBrush,
  onClick,
}: GridCellProps) {
  const status = statusInfo?.status ?? 'Available';

  const getClassName = (): string => {
    const classes = ['seat-cell'];

    if (!element) {
      classes.push('empty');
      if (hasBrush) classes.push('type-brush');
      return classes.join(' ');
    }

    if (isLocked) {
      classes.push('locked');
    } else if (status === 'Booked') {
      classes.push('booked');
    } else if (status === 'Held') {
      classes.push('held');
    } else {
      classes.push('available');
    }

    if (isSelected) classes.push('selected');
    return classes.join(' ');
  };

  const cellContent = element ? (
    <>
      <span className="seat-cell-label">{element.label}</span>
      <span className="seat-cell-cap">
        {statusInfo && status !== 'Available'
          ? `${statusInfo.seatsSold}/${element.capacity}`
          : `x${element.capacity}`}
      </span>
      {isLocked && <LockOutlined style={{ fontSize: 10, opacity: 0.6 }} />}
    </>
  ) : null;

  const tooltipText = isLocked
    ? 'Cannot edit — table has active bookings or holds'
    : element
      ? `${element.label} — ${element.capacity} seats — ${status}`
      : hasBrush
        ? 'Click to place table'
        : '';

  // Fill cell with the table's color for clear visual distinction
  const cellStyle: React.CSSProperties = {};
  if (element?.color) {
    const color = element.color;
    if (isLocked) {
      cellStyle.background = hexToRgba(color, 0.12);
      cellStyle.borderColor = hexToRgba(color, 0.4);
    } else if (status === 'Booked') {
      cellStyle.background = hexToRgba(color, 0.25);
      cellStyle.borderColor = color;
    } else if (status === 'Held') {
      cellStyle.background = hexToRgba(color, 0.2);
      cellStyle.borderColor = color;
    } else {
      cellStyle.background = hexToRgba(color, 0.3);
      cellStyle.borderColor = color;
      cellStyle.color = 'var(--text-primary)';
    }
  }

  return (
    <Tooltip title={tooltipText} mouseEnterDelay={0.4}>
      <div className={getClassName()} style={cellStyle} onClick={onClick}>
        {cellContent}
      </div>
    </Tooltip>
  );
}
