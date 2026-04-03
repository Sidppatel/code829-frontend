import { useCallback } from 'react';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { LayoutTable, EditorMode } from '../LayoutEditorPage';
import { centsToUSD } from '../../../../utils/currency';

interface TableElementProps {
  table: LayoutTable;
  isSelected: boolean;
  editorMode: EditorMode;
  isLocked: boolean;
  onClick: () => void;
}

function getShapeClass(shape: string): string {
  switch (shape) {
    case 'Round':
    case 'Cocktail':
      return 'fp-table-round';
    case 'Rectangle':
      return 'fp-table-rect';
    case 'Square':
    default:
      return 'fp-table-square';
  }
}

export default function TableElement({
  table,
  isSelected,
  editorMode,
  isLocked,
  onClick,
}: TableElementProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  }, [onClick]);

  const status = table.status ?? 'Available';
  const bgColor = table.color ?? 'var(--accent-violet)';
  const shapeClass = getShapeClass(table.shape);

  const statusClass = status === 'Booked' ? ' fp-table-booked'
    : status === 'Locked' ? ' fp-table-locked' : '';
  const selectedClass = isSelected ? ' fp-table-selected' : '';
  const deleteClass = editorMode === 'delete' && !isLocked ? ' fp-table-delete-mode' : '';
  const inactiveClass = !table.isActive ? ' fp-table-inactive' : '';

  const cursor = editorMode === 'select' ? 'pointer'
    : editorMode === 'delete' ? (isLocked ? 'not-allowed' : 'pointer')
    : 'default';

  return (
    <div
      className={`fp-table ${shapeClass}${statusClass}${selectedClass}${deleteClass}${inactiveClass}`}
      style={{
        '--table-color': bgColor,
        cursor,
      } as React.CSSProperties}
      onClick={handleClick}
    >
      {/* Status badge */}
      {status !== 'Available' && (
        <div
          className={`fp-table-badge${status === 'Booked' ? ' booked' : ' locked'}`}
          title={status === 'Booked' ? 'Booked' : 'Locked by user'}
        >
          {status === 'Booked' ? <CheckCircleOutlined /> : <LockOutlined />}
        </div>
      )}

      <div className="fp-table-label">{table.label}</div>
      <div className="fp-table-meta">
        {table.capacity}p &middot; {centsToUSD(table.priceCents)}
      </div>
    </div>
  );
}
