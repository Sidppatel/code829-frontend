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

  const cellStyle: React.CSSProperties = element?.color
    ? { borderColor: isLocked ? undefined : element.color, ['--cell-color' as string]: element.color }
    : {};

  return (
    <Tooltip title={tooltipText} mouseEnterDelay={0.4}>
      <div className={getClassName()} style={cellStyle} onClick={onClick}>
        {cellContent}
      </div>
    </Tooltip>
  );
}
