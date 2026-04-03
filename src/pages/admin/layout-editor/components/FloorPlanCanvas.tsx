import { useRef, useCallback } from 'react';
import type { LayoutTable, EditorMode } from '../LayoutEditorPage';
import TableElement from './TableElement';

interface FloorPlanCanvasProps {
  tables: LayoutTable[];
  gridRows: number;
  gridCols: number;
  selectedTableId: string | null;
  editorMode: EditorMode;
  disabled: boolean;
  onCanvasClick: (posX: number, posY: number) => void;
  onTableClick: (tableId: string) => void;
  onTableDragEnd: (tableId: string, posX: number, posY: number) => void;
}

export default function FloorPlanCanvas({
  tables,
  gridRows,
  gridCols,
  selectedTableId,
  editorMode,
  disabled,
  onCanvasClick,
  onTableClick,
  onTableDragEnd,
}: FloorPlanCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (disabled || editorMode !== 'add') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Only fire on direct canvas click, not on table elements
    if (e.target !== canvas && !(e.target as HTMLElement).classList.contains('floor-plan-grid-overlay')) return;

    const rect = canvas.getBoundingClientRect();
    const posX = Math.round(((e.clientX - rect.left) / rect.width) * 10000) / 100;
    const posY = Math.round(((e.clientY - rect.top) / rect.height) * 10000) / 100;
    onCanvasClick(
      Math.max(0, Math.min(100, posX)),
      Math.max(0, Math.min(100, posY)),
    );
  }, [disabled, editorMode, onCanvasClick]);

  const cursorMap: Record<EditorMode, string> = {
    select: 'default',
    add: 'crosshair',
    move: 'default',
    delete: 'default',
  };

  // Build grid lines for visual reference
  const gridLines: React.ReactNode[] = [];
  for (let r = 1; r < gridRows; r++) {
    const pct = (r / gridRows) * 100;
    gridLines.push(
      <div
        key={`h-${r}`}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${pct}%`,
          height: 1,
          background: 'var(--border-light, rgba(255,255,255,0.06))',
          pointerEvents: 'none',
        }}
      />
    );
  }
  for (let c = 1; c < gridCols; c++) {
    const pct = (c / gridCols) * 100;
    gridLines.push(
      <div
        key={`v-${c}`}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${pct}%`,
          width: 1,
          background: 'var(--border-light, rgba(255,255,255,0.06))',
          pointerEvents: 'none',
        }}
      />
    );
  }

  return (
    <div className="layout-editor-canvas-wrapper">
      <div
        ref={canvasRef}
        className="layout-editor-canvas"
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: `${(gridRows / gridCols) * 100}%`,
          background: 'var(--bg-secondary)',
          borderRadius: 12,
          border: '1px solid var(--border-default, rgba(255,255,255,0.1))',
          cursor: disabled ? 'default' : cursorMap[editorMode],
          overflow: 'hidden',
        }}
        onClick={handleCanvasClick}
      >
        {/* Grid overlay */}
        <div
          className="floor-plan-grid-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: editorMode === 'add' ? 'auto' : 'none',
          }}
          onClick={handleCanvasClick}
        >
          {gridLines}
        </div>

        {/* Table elements */}
        {tables.map((table) => (
          <TableElement
            key={table.id}
            table={table}
            isSelected={table.id === selectedTableId}
            editorMode={editorMode}
            disabled={disabled}
            canvasRef={canvasRef}
            onClick={onTableClick}
            onDragEnd={onTableDragEnd}
          />
        ))}
      </div>
    </div>
  );
}
