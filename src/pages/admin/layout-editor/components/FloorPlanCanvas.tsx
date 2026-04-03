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
  selectedEventTableColor?: string;
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
  selectedEventTableColor,
  onCellClick,
  onTableClick,
}: FloorPlanCanvasProps) {
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

  const isAddMode = editorMode === 'add';

  // Column headers (A, B, C, ...)
  const colHeaders: React.ReactNode[] = [
    <div key="corner" className="fp-header-corner" />,
  ];
  for (let c = 0; c < gridCols; c++) {
    colHeaders.push(
      <div key={`col-${c}`} className="fp-col-header">
        {c + 1}
      </div>
    );
  }

  // Build rows with row headers + cells
  const rows: React.ReactNode[] = [];
  for (let r = 0; r < gridRows; r++) {
    const rowCells: React.ReactNode[] = [
      <div key={`row-${r}`} className="fp-row-header">{r + 1}</div>,
    ];

    for (let c = 0; c < gridCols; c++) {
      const key = `${r},${c}`;
      const table = cellMap.get(key);

      if (table) {
        rowCells.push(
          <div key={key} className="fp-cell fp-cell-occupied">
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
        rowCells.push(
          <div
            key={key}
            role={isAddMode ? 'button' : undefined}
            tabIndex={isAddMode ? 0 : -1}
            className={`fp-cell fp-cell-empty${isAddMode ? ' fp-cell-addable' : ''}`}
            style={isAddMode && selectedEventTableColor ? {
              '--add-preview-color': selectedEventTableColor,
            } as React.CSSProperties : undefined}
            onClick={() => handleCellClick(r, c)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellClick(r, c);
            }}
          >
            {isAddMode && (
              <span className="fp-cell-plus">+</span>
            )}
          </div>
        );
      }
    }

    rows.push(
      <div key={`row-${r}`} className="fp-grid-row">
        {rowCells}
      </div>
    );
  }

  return (
    <div className="fp-wrapper">
      {/* Column headers */}
      <div className="fp-grid-row fp-header-row">
        {colHeaders}
      </div>
      {/* Grid rows */}
      {rows}
    </div>
  );
}
