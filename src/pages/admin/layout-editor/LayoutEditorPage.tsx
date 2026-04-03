import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button, Space, App } from 'antd';
import { InfoCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { adminLayoutApi } from '../../../services/api';
import type { LayoutStatsResponse, TableType } from '../../../types/layout';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import ControlsPanel from './components/ControlsPanel';
import FloorPlanCanvas from './components/FloorPlanCanvas';
import LayoutStatsBar from './components/LayoutStatsBar';

export interface LayoutTable {
  id: string;
  label: string;
  capacity: number;
  shape: string;
  color?: string;
  priceCents: number;
  isActive: boolean;
  posX: number;
  posY: number;
  sortOrder: number;
  tableTypeId?: string;
  tableTypeName?: string;
  status?: 'Available' | 'Locked' | 'Booked';
}

export type EditorMode = 'add' | 'move' | 'delete' | 'select';

export default function LayoutEditorPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { message } = App.useApp();

  const [tables, setTables] = useState<LayoutTable[]>([]);
  const [tableTypes, setTableTypes] = useState<TableType[]>([]);
  const [stats, setStats] = useState<LayoutStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [gridRows, setGridRows] = useState(10);
  const [gridCols, setGridCols] = useState(10);

  const [editorMode, setEditorMode] = useState<EditorMode>('select');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

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

  const loadAll = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setStatsLoading(true);
    try {
      const [layoutRes, typesRes, statsRes] = await Promise.all([
        adminLayoutApi.getLayout(eventId),
        adminLayoutApi.listTableTypes(),
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
      setTableTypes(typesRes.data ?? []);
      setStats(statsRes.data);
    } catch {
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
          capacity: t.capacity,
          shape: t.shape,
          color: t.color,
          priceType: 'PerTable',
          priceCents: t.priceCents,
          isActive: t.isActive,
          posX: t.posX,
          posY: t.posY,
          sortOrder: t.sortOrder,
          tableTypeId: t.tableTypeId,
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
          capacity: t.capacity,
          shape: t.shape,
          color: t.color,
          priceType: 'PerTable',
          priceCents: t.priceCents,
          isActive: t.isActive,
          posX: t.posX,
          posY: t.posY,
          sortOrder: t.sortOrder,
          tableTypeId: t.tableTypeId,
        })),
      });
      setIsDirty(false);
      message.success('Layout saved');
      const statsRes = await adminLayoutApi.getLayoutStats(eventId);
      setStats(statsRes.data);
    } catch (err: unknown) {
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

  const handleCanvasClick = useCallback((posX: number, posY: number) => {
    if (editorMode === 'add' && selectedTypeId) {
      const tt = tableTypes.find((t) => t.id === selectedTypeId);
      if (!tt) return;

      const existingLabels = new Set(tables.map((t) => t.label));
      const baseName = tt.name.length > 16 ? tt.name.slice(0, 16) : tt.name;
      let label = baseName;
      let counter = 1;
      while (existingLabels.has(label)) {
        counter++;
        label = `${baseName} ${counter}`;
      }

      const newTable: LayoutTable = {
        id: crypto.randomUUID(),
        label,
        capacity: tt.defaultCapacity,
        shape: tt.defaultShape ?? 'Round',
        color: tt.defaultColor,
        priceCents: tt.defaultPriceCents ?? 0,
        isActive: true,
        posX,
        posY,
        sortOrder: tables.length,
        tableTypeId: tt.id,
        tableTypeName: tt.name,
        status: 'Available',
      };
      updateTables((prev) => [...prev, newTable]);
      setSelectedTableId(newTable.id);
    }
  }, [editorMode, selectedTypeId, tableTypes, tables, updateTables]);

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

  const handleTableDragEnd = useCallback((tableId: string, posX: number, posY: number) => {
    if (isTableLocked(tableId)) return;
    updateTables((prev) => prev.map((t) =>
      t.id === tableId ? { ...t, posX, posY } : t
    ));
  }, [isTableLocked, updateTables]);

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

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Layout Editor"
        subtitle={`${tables.length} tables · ${gridRows}x${gridCols} grid`}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveLayout}
              loading={saving}
              disabled={!isDirty}
            >
              Save Layout
            </Button>
          </Space>
        }
      />

      {hasLockedTables && (
        <Alert
          message="Some tables have active bookings"
          description={`${lockedTableIds.size} table(s) are locked in position because they have active bookings or holds. You can still add and modify other tables.`}
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <LayoutStatsBar stats={stats} loading={statsLoading} />

      <div className="layout-editor-container">
        <ControlsPanel
          gridRows={gridRows}
          gridCols={gridCols}
          onGridRowsChange={(v) => { setGridRows(v); setIsDirty(true); }}
          onGridColsChange={(v) => { setGridCols(v); setIsDirty(true); }}
          tableTypes={tableTypes}
          selectedTypeId={selectedTypeId}
          onSelectType={setSelectedTypeId}
          editorMode={editorMode}
          onEditorModeChange={setEditorMode}
          selectedTable={selectedTable}
          onTableUpdate={handleTableUpdate}
          onTableDelete={handleTableDelete}
          onDeselectTable={() => setSelectedTableId(null)}
          disabled={false}
          isSelectedTableLocked={selectedTable ? isTableLocked(selectedTable.id) : false}
        />

        <FloorPlanCanvas
          tables={tables}
          gridRows={gridRows}
          gridCols={gridCols}
          selectedTableId={selectedTableId}
          editorMode={editorMode}
          lockedTableIds={lockedTableIds}
          onCanvasClick={handleCanvasClick}
          onTableClick={handleTableClick}
          onTableDragEnd={handleTableDragEnd}
        />
      </div>
    </div>
  );
}
