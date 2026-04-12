import type { TableTemplate, EventTableType } from '../../../../types/layout';
import type { LayoutTable, EditorMode } from '../LayoutEditorPage';

import GridSizeControl from './GridSizeControl';
import ModeControl from './ModeControl';
import EventTableTypesControl from './EventTableTypesControl';
import SelectedTableControl from './SelectedTableControl';

interface ControlsPanelProps {
  eventId: string;
  gridRows: number;
  gridCols: number;
  onGridRowsChange: (v: number) => void;
  onGridColsChange: (v: number) => void;
  templates: TableTemplate[];
  eventTables: EventTableType[];
  selectedEventTableId: string | null;
  onSelectEventTable: (id: string | null) => void;
  editorMode: EditorMode;
  onEditorModeChange: (mode: EditorMode) => void;
  selectedTable: LayoutTable | null;
  onTableUpdate: (patch: Partial<LayoutTable>) => void;
  onTableDelete: () => void;
  onDeselectTable: () => void;
  disabled: boolean;
  isSelectedTableLocked: boolean;
  onEventTableCreated: (et: EventTableType) => void;
  onEventTableUpdated: (et: EventTableType) => void;
}

export default function ControlsPanel({
  eventId,
  gridRows,
  gridCols,
  onGridRowsChange,
  onGridColsChange,
  templates,
  eventTables,
  selectedEventTableId,
  onSelectEventTable,
  editorMode,
  onEditorModeChange,
  selectedTable,
  onTableUpdate,
  onTableDelete,
  onDeselectTable,
  disabled,
  isSelectedTableLocked,
  onEventTableCreated,
  onEventTableUpdated,
}: ControlsPanelProps) {
  const activeEventTables = eventTables.filter((t) => t.isActive);

  return (
    <div className="layout-editor-controls">
      <GridSizeControl
        gridRows={gridRows}
        gridCols={gridCols}
        onGridRowsChange={onGridRowsChange}
        onGridColsChange={onGridColsChange}
        disabled={disabled}
      />

      <ModeControl
        editorMode={editorMode}
        onEditorModeChange={onEditorModeChange}
        disabled={disabled}
      />

      <EventTableTypesControl
        eventId={eventId}
        templates={templates}
        activeEventTables={activeEventTables}
        selectedEventTableId={selectedEventTableId}
        onSelectEventTable={onSelectEventTable}
        onEditorModeChange={onEditorModeChange}
        onEventTableCreated={onEventTableCreated}
        onEventTableUpdated={onEventTableUpdated}
      />

      <SelectedTableControl
        selectedTable={selectedTable}
        isSelectedTableLocked={isSelectedTableLocked}
        disabled={disabled}
        activeEventTables={activeEventTables}
        onDeselectTable={onDeselectTable}
        onTableUpdate={onTableUpdate}
        onTableDelete={onTableDelete}
      />
    </div>
  );
}
