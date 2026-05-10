import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { buildCoveredSet, colLetter, tablesOverlap } from './floorPlanHelpers';

const SHAPE_RADIUS: Record<string, string> = {
  Round: '50%',
  Cocktail: '50%',
  Square: '4px',
  Rectangle: '6px',
};

const DEFAULT_CELL_PX = 64;
const AXIS_W = 36;
const AXIS_H = 32;

export interface FloorPlanTable {
  id: string;
  gridRow: number;
  gridCol: number;
  rowSpan: number;
  colSpan: number;
  shape: string;
  color?: string;
}

export interface FloorPlanCellContext {
  isSelected: boolean;
  cellPx: number;
  rowSpan: number;
  colSpan: number;
}

export interface FloorPlanGridProps<T extends FloorPlanTable> {
  rows: number;
  cols: number;
  tables: T[];
  cellSize?: number;
  showAxis?: boolean;
  selectedTableId?: string | null;
  renderTable?: (table: T, ctx: FloorPlanCellContext) => ReactNode;
  tableClassName?: (table: T, ctx: FloorPlanCellContext) => string | undefined;
  tableStyle?: (table: T, ctx: FloorPlanCellContext) => CSSProperties | undefined;
  onCellClick?: (row: number, col: number) => void;
  onTableClick?: (table: T) => void;
  onTableResize?: (id: string, rowSpan: number, colSpan: number) => void;
  addPreviewColor?: string;
  className?: string;
  ariaLabel?: string;
}

export default function FloorPlanGrid<T extends FloorPlanTable>(props: FloorPlanGridProps<T>) {
  const {
    rows,
    cols,
    tables,
    cellSize = DEFAULT_CELL_PX,
    showAxis = true,
    selectedTableId = null,
    renderTable,
    tableClassName,
    tableStyle,
    onCellClick,
    onTableClick,
    onTableResize,
    addPreviewColor,
    className,
    ariaLabel = 'Floor plan',
  } = props;

  const [resizePreview, setResizePreview] = useState<{
    id: string;
    rowSpan: number;
    colSpan: number;
  } | null>(null);
  const previewRef = useRef<{ rowSpan: number; colSpan: number } | null>(null);

  const effectiveTables = useMemo(() => {
    if (!resizePreview) return tables;
    return tables.map((t) =>
      t.id === resizePreview.id
        ? { ...t, rowSpan: resizePreview.rowSpan, colSpan: resizePreview.colSpan }
        : t,
    );
  }, [tables, resizePreview]);

  const coveredSet = useMemo(() => buildCoveredSet(effectiveTables), [effectiveTables]);
  const anchorMap = useMemo(() => {
    const m = new Map<string, T>();
    for (const t of effectiveTables) m.set(`${t.gridRow},${t.gridCol}`, t);
    return m;
  }, [effectiveTables]);

  const colTemplate = `${showAxis ? `${AXIS_W}px ` : ''}repeat(${cols}, ${cellSize}px)`;
  const rowTemplate = `${showAxis ? `${AXIS_H}px ` : ''}repeat(${rows}, ${cellSize}px)`;
  const wrapperStyle: CSSProperties = {
    gridTemplateColumns: colTemplate,
    gridTemplateRows: rowTemplate,
    width: 'max-content',
    maxWidth: '100%',
  };

  const startResize = useCallback(
    (table: T, e: ReactPointerEvent<HTMLDivElement>) => {
      if (!onTableResize) return;
      e.stopPropagation();
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startRow = table.rowSpan;
      const startCol = table.colSpan;
      previewRef.current = { rowSpan: startRow, colSpan: startCol };

      const handleMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const dr = Math.round(dy / cellSize);
        const dc = Math.round(dx / cellSize);
        let newRow = Math.max(1, startRow + dr);
        let newCol = Math.max(1, startCol + dc);
        newRow = Math.min(newRow, rows - table.gridRow);
        newCol = Math.min(newCol, cols - table.gridCol);
        if (newRow < 1 || newCol < 1) return;
        const candidate = {
          id: table.id,
          gridRow: table.gridRow,
          gridCol: table.gridCol,
          rowSpan: newRow,
          colSpan: newCol,
        };
        const conflict = tables.some(
          (other) => other.id !== table.id && tablesOverlap(candidate, other),
        );
        if (conflict) return;
        previewRef.current = { rowSpan: newRow, colSpan: newCol };
        setResizePreview({ id: table.id, rowSpan: newRow, colSpan: newCol });
      };

      const handleUp = () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        window.removeEventListener('pointercancel', handleCancel);
        const final = previewRef.current;
        previewRef.current = null;
        setResizePreview(null);
        if (final && (final.rowSpan !== startRow || final.colSpan !== startCol)) {
          onTableResize(table.id, final.rowSpan, final.colSpan);
        }
      };

      const handleCancel = () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        window.removeEventListener('pointercancel', handleCancel);
        previewRef.current = null;
        setResizePreview(null);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleCancel);
    },
    [onTableResize, tables, cellSize, rows, cols],
  );

  const cells: ReactNode[] = [];

  if (showAxis) {
    cells.push(
      <div key="corner" className="fpg-corner" style={{ gridRow: 1, gridColumn: 1 }} />,
    );
    for (let c = 0; c < cols; c++) {
      cells.push(
        <div
          key={`col-${c}`}
          className="fpg-col-header"
          style={{ gridRow: 1, gridColumn: c + 2 }}
        >
          {colLetter(c)}
        </div>,
      );
    }
    for (let r = 0; r < rows; r++) {
      cells.push(
        <div
          key={`row-${r}`}
          className="fpg-row-header"
          style={{ gridRow: r + 2, gridColumn: 1 }}
        >
          {r + 1}
        </div>,
      );
    }
  }

  const rowOffset = showAxis ? 2 : 1;
  const colOffset = showAxis ? 2 : 1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      if (coveredSet.has(key)) continue;
      const table = anchorMap.get(key);

      if (table) {
        const isSelected = table.id === selectedTableId;
        const ctx: FloorPlanCellContext = {
          isSelected,
          cellPx: cellSize,
          rowSpan: table.rowSpan,
          colSpan: table.colSpan,
        };
        const radius = SHAPE_RADIUS[table.shape] ?? SHAPE_RADIUS.Square;
        const extraCls = tableClassName?.(table, ctx) ?? '';
        const extraStyle = tableStyle?.(table, ctx) ?? {};
        const showHandle = Boolean(onTableResize) && isSelected;

        cells.push(
          <div
            key={`t-${table.id}`}
            className={`fpg-table${isSelected ? ' fpg-table-selected' : ''}${extraCls ? ` ${extraCls}` : ''}`}
            style={{
              gridRow: `${r + rowOffset} / span ${table.rowSpan}`,
              gridColumn: `${c + colOffset} / span ${table.colSpan}`,
              ['--table-bg' as string]: table.color ?? 'var(--primary)',
              borderRadius: radius,
              ...extraStyle,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onTableClick?.(table);
            }}
          >
            {renderTable ? renderTable(table, ctx) : null}
            {showHandle && (
              <div
                className="fpg-resize-handle"
                role="presentation"
                onPointerDown={(e) => startResize(table, e)}
              />
            )}
          </div>,
        );
      } else {
        const isAddable = Boolean(onCellClick);
        const previewStyle: CSSProperties = isAddable && addPreviewColor
          ? { ['--add-preview-color' as string]: addPreviewColor }
          : {};
        cells.push(
          <div
            key={`e-${key}`}
            role={isAddable ? 'button' : undefined}
            tabIndex={isAddable ? 0 : -1}
            aria-label={isAddable ? `Add at ${colLetter(c)}${r + 1}` : undefined}
            className={`fpg-cell-empty${isAddable ? ' fpg-cell-addable' : ''}`}
            style={{
              gridRow: r + rowOffset,
              gridColumn: c + colOffset,
              ...previewStyle,
            }}
            onClick={isAddable ? () => onCellClick?.(r, c) : undefined}
            onKeyDown={
              isAddable
                ? (e) => {
                    if (e.key === 'Enter') onCellClick?.(r, c);
                  }
                : undefined
            }
          >
            {isAddable && <span className="fpg-cell-plus">+</span>}
          </div>,
        );
      }
    }
  }

  return (
    <div
      role="grid"
      aria-label={ariaLabel}
      className={`fpg-wrapper${className ? ` ${className}` : ''}`}
      style={wrapperStyle}
    >
      {cells}
    </div>
  );
}
