import type { EventTableDto } from '../../types/event';

export function colLetter(col: number): string {
  return String.fromCharCode(65 + (col % 26));
}

export function labelFor(table: Pick<EventTableDto, 'label' | 'gridRow' | 'gridCol'>): string {
  return table.label || `${colLetter(table.gridCol)}${table.gridRow + 1}`;
}
