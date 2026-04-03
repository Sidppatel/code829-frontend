import { useRef, useCallback } from 'react';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { LayoutTable, EditorMode } from '../LayoutEditorPage';
import { centsToUSD } from '../../../../utils/currency';

interface TableElementProps {
  table: LayoutTable;
  isSelected: boolean;
  editorMode: EditorMode;
  isLocked: boolean;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onClick: (tableId: string) => void;
  onDragEnd: (tableId: string, posX: number, posY: number) => void;
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

function getShapeSize(shape: string): { width: number; height: number } {
  switch (shape) {
    case 'Cocktail':
      return { width: 48, height: 48 };
    case 'Square':
      return { width: 64, height: 64 };
    case 'Rectangle':
      return { width: 80, height: 56 };
    case 'Round':
    default:
      return { width: 64, height: 64 };
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
  canvasRef,
  onClick,
  onDragEnd,
}: TableElementProps) {
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isLocked || editorMode !== 'move') return;
    isDragging.current = true;
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [isLocked, editorMode]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const el = e.currentTarget as HTMLElement;
    const { width, height } = getShapeSize(table.shape);

    const rawX = e.clientX - canvasRect.left - dragOffset.current.x + width / 2;
    const rawY = e.clientY - canvasRect.top - dragOffset.current.y + height / 2;

    const posX = Math.max(0, Math.min(100, (rawX / canvasRect.width) * 100));
    const posY = Math.max(0, Math.min(100, (rawY / canvasRect.height) * 100));

    el.style.left = `${posX}%`;
    el.style.top = `${posY}%`;
  }, [canvasRef, table.shape]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !canvasRef.current) return;
    isDragging.current = false;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const { width, height } = getShapeSize(table.shape);

    const rawX = e.clientX - canvasRect.left - dragOffset.current.x + width / 2;
    const rawY = e.clientY - canvasRect.top - dragOffset.current.y + height / 2;

    const posX = Math.max(0, Math.min(100, (rawX / canvasRect.width) * 100));
    const posY = Math.max(0, Math.min(100, (rawY / canvasRect.height) * 100));

    onDragEnd(table.id, Math.round(posX * 100) / 100, Math.round(posY * 100) / 100);
  }, [canvasRef, table.id, table.shape, onDragEnd]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (editorMode === 'move') return;
    e.stopPropagation();
    onClick(table.id);
  }, [editorMode, onClick, table.id]);

  const shapeStyle = getShapeStyle(table.shape);
  const { width, height } = getShapeSize(table.shape);
  const bgColor = table.color ?? 'var(--accent-violet)';
  const status = table.status ?? 'Available';
  const { border, boxShadow } = getStatusBorder(status, isSelected);

  const cursorMap: Record<EditorMode, string> = {
    select: 'pointer',
    add: 'default',
    move: isLocked ? 'not-allowed' : 'grab',
    delete: isLocked ? 'not-allowed' : 'pointer',
  };

  return (
    <div
      className={`layout-table-element${isSelected ? ' selected' : ''}${editorMode === 'delete' && !isLocked ? ' delete-mode' : ''}`}
      style={{
        position: 'absolute',
        left: `${table.posX}%`,
        top: `${table.posY}%`,
        transform: 'translate(-50%, -50%)',
        width,
        height,
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
        touchAction: 'none',
        zIndex: isSelected ? 10 : 1,
        ...shapeStyle,
      }}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
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

      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: width - 8 }}>
        {table.label}
      </div>
      <div style={{ fontSize: 9, opacity: 0.85 }}>
        {table.capacity}p · {centsToUSD(table.priceCents)}
      </div>
    </div>
  );
}
