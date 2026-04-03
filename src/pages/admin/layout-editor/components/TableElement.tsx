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

function getShapeStyle(shape: string): React.CSSProperties {
  switch (shape) {
    case 'Round':
    case 'Cocktail':
      return { borderRadius: '50%' };
    case 'Square':
      return { borderRadius: 4 };
    case 'Rectangle':
    default:
      return { borderRadius: 6 };
  }
}

function getStatusBorder(status: string | undefined, isSelected: boolean): { border: string; boxShadow: string } {
  if (isSelected) {
    return {
      border: '3px solid var(--accent-gold)',
      boxShadow: '0 0 0 2px var(--accent-gold)',
    };
  }
  switch (status) {
    case 'Booked':
      return {
        border: '3px solid var(--color-error, #ff4d4f)',
        boxShadow: '0 0 8px rgba(255, 77, 79, 0.4)',
      };
    case 'Locked':
      return {
        border: '3px solid var(--color-warning, #faad14)',
        boxShadow: '0 0 8px rgba(250, 173, 20, 0.4)',
      };
    default:
      return {
        border: '2px solid var(--bg-primary)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      };
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

  const shapeStyle = getShapeStyle(table.shape);
  const bgColor = table.color ?? 'var(--accent-violet)';
  const status = table.status ?? 'Available';
  const { border, boxShadow } = getStatusBorder(status, isSelected);

  const cursorMap: Record<EditorMode, string> = {
    select: 'pointer',
    add: 'default',
    delete: isLocked ? 'not-allowed' : 'pointer',
  };

  return (
    <div
      className={`layout-table-element${isSelected ? ' selected' : ''}${editorMode === 'delete' && !isLocked ? ' delete-mode' : ''}`}
      style={{
        width: '100%',
        height: '100%',
        maxWidth: 80,
        maxHeight: 80,
        aspectRatio: table.shape === 'Rectangle' ? '1.4 / 1' : '1 / 1',
        background: bgColor,
        opacity: table.isActive ? 1 : 0.4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: cursorMap[editorMode],
        border,
        boxShadow,
        color: 'var(--text-on-color)',
        fontSize: 10,
        fontWeight: 600,
        lineHeight: 1.2,
        textAlign: 'center',
        userSelect: 'none',
        position: 'relative',
        ...shapeStyle,
      }}
      onClick={handleClick}
    >
      {/* Status icon badge */}
      {status !== 'Available' && (
        <div
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: status === 'Booked' ? 'var(--color-error, #ff4d4f)' : 'var(--color-warning, #faad14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            zIndex: 11,
          }}
          title={status === 'Booked' ? 'Table is booked' : 'Table is locked by a user'}
        >
          {status === 'Booked' ? <CheckCircleOutlined /> : <LockOutlined />}
        </div>
      )}

      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
        {table.label}
      </div>
      <div style={{ fontSize: 9, opacity: 0.85 }}>
        {table.capacity}p · {centsToUSD(table.priceCents)}
      </div>
    </div>
  );
}
