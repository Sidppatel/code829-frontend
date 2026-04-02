import { useMemo } from 'react';
import { useFloorPlanStore, type FloorPlanElement } from '../../../../stores/floorPlanStore';
import type { TableStatusInfo } from '../../../../types/layout';
import GridCell from './GridCell';
import EmptyState from '../../../../components/shared/EmptyState';

interface SeatingGridProps {
  selectedTableId: string | null;
  selectedTypeId: string | null;
  lockedIds: Set<string>;
  tableStatuses: Record<string, TableStatusInfo>;
  onCellClick: (row: number, col: number, element: FloorPlanElement | null) => void;
}

export default function SeatingGrid({
  selectedTableId,
  selectedTypeId,
  lockedIds,
  tableStatuses,
  onCellClick,
}: SeatingGridProps) {
  const gridDimensions = useFloorPlanStore((s) => s.gridDimensions);
  const elements = useFloorPlanStore((s) => s.elements);

  const cellLookup = useMemo(() => {
    const map = new Map<string, FloorPlanElement>();
    for (const el of Object.values(elements)) {
      if (el.gridRow != null && el.gridCol != null) {
        map.set(`${el.gridRow}-${el.gridCol}`, el);
      }
    }
    return map;
  }, [elements]);

  if (!gridDimensions || gridDimensions.rows < 1 || gridDimensions.cols < 1) {
    return (
      <EmptyState
        title="No Grid Configured"
        description="Set the number of rows and columns in the left panel to start building your floor plan."
      />
    );
  }

  const { rows, cols } = gridDimensions;

  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${cols}, 52px)`,
    gridTemplateRows: `repeat(${rows}, 52px)`,
  };

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r}-${c}`;
      const element = cellLookup.get(key) ?? null;
      const statusInfo = element ? (tableStatuses[element.id] ?? null) : null;
      const isLocked = element ? lockedIds.has(element.id) : false;
      const isSelected = element?.id === selectedTableId;

      cells.push(
        <GridCell
          key={key}
          row={r}
          col={c}
          element={element}
          statusInfo={statusInfo}
          isLocked={isLocked}
          isSelected={isSelected}
          hasBrush={selectedTypeId !== null}
          onClick={() => onCellClick(r, c, element)}
        />,
      );
    }
  }

  return (
    <div className="seating-grid-container">
      <div className="seating-grid" style={gridStyle}>
        {cells}
      </div>
    </div>
  );
}
