import type { EventTableDto } from '../../types/event';

export function colLetter(col: number): string {
  return String.fromCharCode(65 + (col % 26));
}

export function labelFor(table: Pick<EventTableDto, 'label' | 'gridRow' | 'gridCol'>): string {
  return table.label || `${colLetter(table.gridCol)}${table.gridRow + 1}`;
}

export interface SpanCell {
  id: string;
  gridRow: number;
  gridCol: number;
  rowSpan: number;
  colSpan: number;
}

/** Cells covered by any spanning table EXCEPT the anchor (top-left) cell. */
export function buildCoveredSet(tables: SpanCell[]): Set<string> {
  const set = new Set<string>();
  for (const t of tables) {
    const rs = Math.max(1, t.rowSpan);
    const cs = Math.max(1, t.colSpan);
    for (let dr = 0; dr < rs; dr++) {
      for (let dc = 0; dc < cs; dc++) {
        if (dr === 0 && dc === 0) continue;
        set.add(`${t.gridRow + dr},${t.gridCol + dc}`);
      }
    }
  }
  return set;
}

/** AABB overlap — mirrors backend sp_check_grid_overlap. */
export function tablesOverlap(a: SpanCell, b: SpanCell): boolean {
  return (
    a.gridRow < b.gridRow + Math.max(1, b.rowSpan) &&
    b.gridRow < a.gridRow + Math.max(1, a.rowSpan) &&
    a.gridCol < b.gridCol + Math.max(1, b.colSpan) &&
    b.gridCol < a.gridCol + Math.max(1, a.colSpan)
  );
}

export function fitsInGrid(t: SpanCell, rows: number, cols: number): boolean {
  return (
    t.gridRow >= 0 &&
    t.gridCol >= 0 &&
    t.gridRow + Math.max(1, t.rowSpan) <= rows &&
    t.gridCol + Math.max(1, t.colSpan) <= cols
  );
}
