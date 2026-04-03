import { useCallback, useMemo } from 'react';
import type { LayoutTable, EditorMode } from '../LayoutEditorPage';
import TableElement from './TableElement';

interface FloorPlanCanvasProps {
  tables: LayoutTable[];
  gridRows: number;
  gridCols: number;
  selectedTableId: string | null;
  editorMode: EditorMode;
  lockedTableIds: Set<string>;
  onCellClick: (row: number, col: number) => void;
  onTableClick: (tableId: string) => void;
}

export default function FloorPlanCanvas({
  tables,
  gridRows,
  gridCols,
  selectedTableId,
  editorMode,
  lockedTableIds,
  onCellClick,
  onTableClick,
}: FloorPlanCanvasProps) {
  // Build a map of (row,col) -> table for quick lookup
  const cellMap = useMemo(() => {
    const map = new Map<string, LayoutTable>();
    for (const t of tables) {
      map.set(`${t.gridRow},${t.gridCol}`, t);
    }
    return map;
  }, [tables]);

  const handleCellClick = useCallback((row: number, col: number) => {
    const existing = cellMap.get(`${row},${col}`);
    if (existing) {
      onTableClick(existing.id);
    } else if (editorMode === 'add') {
      onCellClick(row, col);
    }
  }, [cellMap, editorMode, onCellClick, onTableClick]);

  // Build grid cells
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const key = `${r},${c}`;
      const table = cellMap.get(key);

      if (table) {
        cells.push(
          <div
            key={key}
            style={{
              gridRow: r + 1,
              gridColumn: c + 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 2,
            }}
          >
            <TableElement
              table={table}
              isSelected={table.id === selectedTableId}
              editorMode={editorMode}
              isLocked={lockedTableIds.has(table.id)}
              onClick={() => onTableClick(table.id)}
            />
          </div>
        );
      } else {
        cells.push(
          <div
            key={key}
            role="button"
            tabIndex={editorMode === 'add' ? 0 : -1}
            className={`grid-empty-cell${editorMode === 'add' ? ' addable' : ''}`}
            style={{
              gridRow: r + 1,
              gridColumn: c + 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed var(--border-light, rgba(255,255,255,0.08))',
              borderRadius: 4,
              cursor: editorMode === 'add' ? 'crosshair' : 'default',
              transition: 'background 0.15s ease',
              minHeight: 48,
            }}
            onClick={() => handleCellClick(r, c)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellClick(r, c);
            }}
          />
        );
      }
    }
  }

  return (
    <div className="layout-editor-canvas-wrapper">
      <div
        className="layout-editor-canvas"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 1fr)`,
          gap: 4,
          width: '100%',
          aspectRatio: `${gridCols} / ${gridRows}`,
          background: 'var(--bg-secondary)',
          borderRadius: 12,
          border: '1px solid var(--border-default, rgba(255,255,255,0.1))',
          padding: 8,
          overflow: 'hidden',
        }}
      >
        {cells}
      </div>
    </div>
  );
}
