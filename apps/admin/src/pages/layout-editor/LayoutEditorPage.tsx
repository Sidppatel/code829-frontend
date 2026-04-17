import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, App } from 'antd';
import { CloseOutlined, InfoCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { adminLayoutApi } from '../../services/api';
import type { LayoutStatsResponse, TableTemplate, EventTableType } from '@code829/shared/types/layout';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import ControlsPanel from './components/ControlsPanel';
import FloorPlanCanvas from './components/FloorPlanCanvas';
import LayoutStatsBar from './components/LayoutStatsBar';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Admin/LayoutEditorPage');

export interface LayoutTable {
  id: string;
  label: string;
  gridRow: number;
  gridCol: number;
  isActive: boolean;
  sortOrder: number;
  eventTableId: string;
  eventTableLabel?: string;
  // Joined from EventTable (read-only)
  capacity: number;
  shape: string;
  color?: string;
  priceCents: number;
  status?: 'Available' | 'Locked' | 'Booked';
}

export type EditorMode = 'add' | 'delete' | 'select';

export default function LayoutEditorPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();

  const [tables, setTables] = useState<LayoutTable[]>([]);
  const [templates, setTemplates] = useState<TableTemplate[]>([]);
  const [eventTables, setEventTables] = useState<EventTableType[]>([]);
  const [stats, setStats] = useState<LayoutStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [gridRows, setGridRows] = useState(10);
  const [gridCols, setGridCols] = useState(10);

  const [editorMode, setEditorMode] = useState<EditorMode>('select');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedEventTableId, setSelectedEventTableId] = useState<string | null>(null);

  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedTable = tables.find((t) => t.id === selectedTableId) ?? null;

  // Derived: set of table IDs that are locked (Booked or Locked status)
  const lockedTableIds = useMemo(
    () => new Set(tables.filter((t) => t.status === 'Booked' || t.status === 'Locked').map((t) => t.id)),
    [tables],
  );
  const hasLockedTables = lockedTableIds.size > 0;

  const isTableLocked = useCallback(
    (tableId: string) => lockedTableIds.has(tableId),
    [lockedTableIds],
  );

  // Build occupied cells set for collision detection
  const occupiedCells = useMemo(() => {
    const set = new Set<string>();
    for (const t of tables) {
      set.add(`${t.gridRow},${t.gridCol}`);
    }
    return set;
  }, [tables]);

  const loadAll = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setStatsLoading(true);
    try {
      const [layoutRes, templatesRes, eventTablesRes, statsRes] = await Promise.all([
        adminLayoutApi.getLayout(eventId),
        adminLayoutApi.listTableTemplates(),
        adminLayoutApi.listEventTables(eventId),
        adminLayoutApi.getLayoutStats(eventId),
      ]);

      const layoutData = layoutRes.data as {
        gridRows?: number;
        gridCols?: number;
        tables?: LayoutTable[];
      };
      setGridRows(layoutData.gridRows ?? 10);
      setGridCols(layoutData.gridCols ?? 10);
      setTables(layoutData.tables ?? []);
      setTemplates(templatesRes.data ?? []);
      setEventTables(eventTablesRes.data ?? []);
      setStats(statsRes.data);
      log.info('Layout loaded', { eventId, tableCount: (layoutData.tables ?? []).length, gridRows: layoutData.gridRows, gridCols: layoutData.gridCols });
    } catch (err) {
      log.error('Failed to load layout', err);
      message.error('Failed to load layout');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, [eventId, message]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Debounced draft auto-save
  useEffect(() => {
    if (!isDirty || !eventId) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      void adminLayoutApi.saveDraft(eventId, {
        gridRows,
        gridCols,
        tables: tables.map((t) => ({
          id: t.id,
          label: t.label,
          gridRow: t.gridRow,
          gridCol: t.gridCol,
          isActive: t.isActive,
          sortOrder: t.sortOrder,
          eventTableId: t.eventTableId,
        })),
      });
    }, 800);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [isDirty, eventId, tables, gridRows, gridCols]);

  // beforeunload warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleSaveLayout = async () => {
    if (!eventId) return;
    setSaving(true);
    try {
      await adminLayoutApi.saveLayout(eventId, {
        gridRows,
        gridCols,
        tables: tables.map((t) => ({
          id: t.id,
          label: t.label,
          gridRow: t.gridRow,
          gridCol: t.gridCol,
          isActive: t.isActive,
          sortOrder: t.sortOrder,
          eventTableId: t.eventTableId,
        })),
      });
      setIsDirty(false);
      log.info('Layout saved', { eventId, tableCount: tables.length });
      message.success('Layout saved');
      const statsRes = await adminLayoutApi.getLayoutStats(eventId);
      setStats(statsRes.data);
    } catch (err: unknown) {
      log.error('Failed to save layout', err);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const errMsg = axiosErr?.response?.data?.message ?? (err instanceof Error ? err.message : 'Unknown error');
      message.error(`Failed to save layout: ${errMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const updateTables = useCallback((updater: (prev: LayoutTable[]) => LayoutTable[]) => {
    setTables(updater);
    setIsDirty(true);
  }, []);

  const handleCellClick = useCallback(async (row: number, col: number) => {
    if (editorMode !== 'add' || !selectedEventTableId) return;

    // Check if cell is already occupied
    if (occupiedCells.has(`${row},${col}`)) {
      message.warning('This cell is already occupied');
      return;
    }

    let et = eventTables.find((t) => t.id === selectedEventTableId);
    if (!et) return;

    // If this event table type is pending (not yet in DB), persist it now
    if (et.isPending) {
      try {
        const res = await adminLayoutApi.createEventTable(eventId!, {
          tableTemplateId: et.tableTemplateId,
          label: et.label,
          capacity: et.capacity,
          shape: et.shape,
          color: et.color,
          priceCents: et.priceCents,
        });
        const savedEt = res.data;
        // Replace pending entry in eventTables list
        setEventTables((prev) => prev.map((x) => x.id === selectedEventTableId ? savedEt : x));
        setSelectedEventTableId(savedEt.id);
        et = savedEt;
      } catch (err) {
        log.error('Failed to persist pending event table type', err);
        message.error('Failed to save table type');
        return;
      }
    }

    // Default label to a grid-coordinate style (A1, B3, …) so the label visible in the
    // editor is the same string the public checkout and booking record store. Admin can
    // still rename via SelectedTableControl. If the auto-computed coord is already taken
    // (e.g., editing a weird layout), fall back to numeric suffixes so save doesn't fail.
    const existingLabels = new Set(tables.map((t) => t.label));
    const coordLabel = `${String.fromCharCode(65 + (col % 26))}${row + 1}`;
    let label = coordLabel;
    let counter = 2;
    while (existingLabels.has(label)) {
      label = `${coordLabel}-${counter++}`;
    }

    const newTable: LayoutTable = {
      id: crypto.randomUUID(),
      label,
      gridRow: row,
      gridCol: col,
      isActive: true,
      sortOrder: tables.length,
      eventTableId: et.id,
      eventTableLabel: et.label,
      capacity: et.capacity,
      shape: et.shape,
      color: et.color,
      priceCents: et.priceCents,
      status: 'Available',
    };
    updateTables((prev) => [...prev, newTable]);
    setSelectedTableId(newTable.id);
  }, [editorMode, selectedEventTableId, eventTables, tables, occupiedCells, updateTables, message, eventId]);

  const handleTableClick = useCallback((tableId: string) => {
    if (editorMode === 'delete') {
      if (isTableLocked(tableId)) {
        message.warning('This table has active bookings and cannot be removed');
        return;
      }
      updateTables((prev) => prev.filter((t) => t.id !== tableId));
      if (selectedTableId === tableId) setSelectedTableId(null);
    } else {
      setSelectedTableId(tableId);
    }
  }, [editorMode, selectedTableId, updateTables, isTableLocked, message]);

  const handleTableUpdate = useCallback((patch: Partial<LayoutTable>) => {
    if (!selectedTableId || isTableLocked(selectedTableId)) return;
    updateTables((prev) => prev.map((t) =>
      t.id === selectedTableId ? { ...t, ...patch } : t
    ));
  }, [selectedTableId, isTableLocked, updateTables]);

  const handleTableDelete = useCallback(() => {
    if (!selectedTableId || isTableLocked(selectedTableId)) {
      message.warning('This table has active bookings and cannot be removed');
      return;
    }
    updateTables((prev) => prev.filter((t) => t.id !== selectedTableId));
    setSelectedTableId(null);
  }, [selectedTableId, isTableLocked, updateTables, message]);

  const handleBack = useCallback(() => {
    const goBack = () => navigate(`/events/${eventId}`);
    if (isDirty) {
      modal.confirm({
        title: 'Unsaved changes',
        content: 'You have unsaved layout changes. Are you sure you want to leave?',
        okText: 'Leave',
        okType: 'danger',
        cancelText: 'Stay',
        onOk: goBack,
      });
    } else {
      goBack();
    }
  }, [eventId, isDirty, modal, navigate]);

  const handleEventTableCreated = useCallback((et: EventTableType) => {
    setEventTables((prev) => [...prev, et]);
  }, []);

  const handleEventTableUpdated = useCallback((updated: EventTableType) => {
    setEventTables((prev) => prev.map((et) => et.id === updated.id ? updated : et));
    // Also update any tables using this event table with the new properties
    updateTables((prev) => prev.map((t) =>
      t.eventTableId === updated.id
        ? { ...t, capacity: updated.capacity, shape: updated.shape, color: updated.color, priceCents: updated.priceCents, eventTableLabel: updated.label }
        : t
    ));
  }, [updateTables]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Layout Editor"
        subtitle={`${tables.length} tables · ${gridRows}x${gridCols} grid`}
        onBack={handleBack}
      />

      {hasLockedTables && (
        <Alert
          title={`${lockedTableIds.size} table(s) locked — active bookings`}
          description="Locked tables can't be moved or removed. You can still add and modify other tables."
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <LayoutStatsBar stats={stats} loading={statsLoading} />

      <div className="layout-editor-container">
        <ControlsPanel
          eventId={eventId!}
          gridRows={gridRows}
          gridCols={gridCols}
          onGridRowsChange={(v: number) => { setGridRows(v); setIsDirty(true); }}
          onGridColsChange={(v: number) => { setGridCols(v); setIsDirty(true); }}
          templates={templates}
          eventTables={eventTables}
          selectedEventTableId={selectedEventTableId}
          onSelectEventTable={setSelectedEventTableId}
          editorMode={editorMode}
          onEditorModeChange={setEditorMode}
          selectedTable={selectedTable}
          onTableUpdate={handleTableUpdate}
          onTableDelete={handleTableDelete}
          onDeselectTable={() => setSelectedTableId(null)}
          disabled={false}
          isSelectedTableLocked={selectedTable ? isTableLocked(selectedTable.id) : false}
          onEventTableCreated={handleEventTableCreated}
          onEventTableUpdated={handleEventTableUpdated}
        />

        <FloorPlanCanvas
          tables={tables}
          gridRows={gridRows}
          gridCols={gridCols}
          selectedTableId={selectedTableId}
          editorMode={editorMode}
          lockedTableIds={lockedTableIds}
          selectedEventTableColor={eventTables.find((et) => et.id === selectedEventTableId)?.color ?? undefined}
          onCellClick={handleCellClick}
          onTableClick={handleTableClick}
        />
      </div>

      <div className="layout-editor-footer">
        <Button
          icon={<CloseOutlined />}
          onClick={handleBack}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSaveLayout}
          loading={saving}
          disabled={!isDirty}
        >
          Save Layout
        </Button>
      </div>
    </div>
  );
}
