import { useRef, useCallback } from 'react';
import type { LayoutTable, EditorMode } from '../LayoutEditorPage';
import { centsToUSD } from '../../../../utils/currency';

interface TableElementProps {
  table: LayoutTable;
  isSelected: boolean;
  editorMode: EditorMode;
  disabled: boolean;
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

export default function TableElement({
  table,
  isSelected,
  editorMode,
  disabled,
  canvasRef,
  onClick,
  onDragEnd,
}: TableElementProps) {
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled || editorMode !== 'move') return;
    isDragging.current = true;
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [disabled, editorMode]);

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

  const cursorMap: Record<EditorMode, string> = {
    select: 'pointer',
    add: 'default',
    move: 'grab',
    delete: 'pointer',
  };

  return (
    <div
      className={`layout-table-element${isSelected ? ' selected' : ''}${editorMode === 'delete' ? ' delete-mode' : ''}`}
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
        cursor: disabled ? 'default' : cursorMap[editorMode],
        border: isSelected
          ? '3px solid var(--accent-gold)'
          : '2px solid var(--bg-primary)',
        boxShadow: isSelected
          ? '0 0 0 2px var(--accent-gold)'
          : '0 2px 6px rgba(0,0,0,0.15)',
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
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: width - 8 }}>
        {table.label}
      </div>
      <div style={{ fontSize: 9, opacity: 0.85 }}>
        {table.capacity}p · {centsToUSD(table.priceCents)}
      </div>
    </div>
  );
}
