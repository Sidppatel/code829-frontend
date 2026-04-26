import type { LayoutTable, EditorMode } from '@code829/shared/types/layout';
import { FloorPlanGrid } from '@code829/shared/components/floorplan';
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
  onTableResize: (tableId: string, rowSpan: number, colSpan: number) => void;
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
  onTableResize,
}: FloorPlanCanvasProps) {
  const isAddMode = editorMode === 'add';

  return (
    <FloorPlanGrid
      rows={gridRows}
      cols={gridCols}
      tables={tables}
      selectedTableId={selectedTableId}
      addPreviewColor={isAddMode ? selectedEventTableColor : undefined}
      onCellClick={isAddMode ? onCellClick : undefined}
      onTableClick={(t) => onTableClick(t.id)}
      onTableResize={
        editorMode === 'select' && selectedTableId
          ? (id, rs, cs) => {
              if (lockedTableIds.has(id)) return;
              onTableResize(id, rs, cs);
            }
          : undefined
      }
      tableClassName={(t) => {
        const status = t.status ?? 'Available';
        const cls: string[] = [];
        if (status === 'Booked') cls.push('fp-table-booked');
        else if (status === 'Locked') cls.push('fp-table-locked');
        if (!t.isActive) cls.push('fp-table-inactive');
        if (editorMode === 'delete' && !lockedTableIds.has(t.id)) cls.push('fp-table-delete-mode');
        return cls.join(' ');
      }}
      renderTable={(t) => (
        <TableElement
          table={t}
          editorMode={editorMode}
          isLocked={lockedTableIds.has(t.id)}
        />
      )}
    />
  );
}
