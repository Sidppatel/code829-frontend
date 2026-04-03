import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button, Space, App } from 'antd';
import { LockOutlined, SaveOutlined } from '@ant-design/icons';
import { adminLayoutApi } from '../../../services/api';
import { adminEventsApi } from '../../../services/adminEventsApi';
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
}

export type EditorMode = 'add' | 'move' | 'delete' | 'select';

export default function LayoutEditorPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { message } = App.useApp();

  const [tables, setTables] = useState<LayoutTable[]>([]);
  const [tableTypes, setTableTypes] = useState<TableType[]>([]);
  const [stats, setStats] = useState<LayoutStatsResponse | null>(null);
  const [layoutLocked, setLayoutLocked] = useState(false);
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

  const loadAll = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setStatsLoading(true);
    try {
      const [layoutRes, lockedRes, typesRes, statsRes] = await Promise.all([
        adminLayoutApi.getLayout(eventId),
        adminEventsApi.checkLayoutLocked(eventId),
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
      setLayoutLocked(lockedRes.data.locked);
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
    if (layoutLocked) {
      message.info('Layout is locked -- tables have active bookings');
      return;
    }
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
      };
      updateTables((prev) => [...prev, newTable]);
      setSelectedTableId(newTable.id);
    }
  }, [layoutLocked, editorMode, selectedTypeId, tableTypes, tables, updateTables, message]);

  const handleTableClick = useCallback((tableId: string) => {
    if (layoutLocked) {
      message.info('Layout is locked -- tables have active bookings');
      return;
    }
    if (editorMode === 'delete') {
      updateTables((prev) => prev.filter((t) => t.id !== tableId));
      if (selectedTableId === tableId) setSelectedTableId(null);
    } else {
      setSelectedTableId(tableId);
    }
  }, [layoutLocked, editorMode, selectedTableId, updateTables, message]);

  const handleTableDragEnd = useCallback((tableId: string, posX: number, posY: number) => {
    if (layoutLocked) return;
    updateTables((prev) => prev.map((t) =>
      t.id === tableId ? { ...t, posX, posY } : t
    ));
  }, [layoutLocked, updateTables]);

  const handleTableUpdate = useCallback((patch: Partial<LayoutTable>) => {
    if (!selectedTableId) return;
    updateTables((prev) => prev.map((t) =>
      t.id === selectedTableId ? { ...t, ...patch } : t
    ));
  }, [selectedTableId, updateTables]);

  const handleTableDelete = useCallback(() => {
    if (!selectedTableId) return;
    updateTables((prev) => prev.filter((t) => t.id !== selectedTableId));
    setSelectedTableId(null);
  }, [selectedTableId, updateTables]);

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
              disabled={!isDirty || layoutLocked}
            >
              Save Layout
            </Button>
          </Space>
        }
      />

      {layoutLocked && (
        <Alert
          message="Layout Locked"
          description="This layout cannot be modified because one or more tables have active bookings or holds."
          type="warning"
          icon={<LockOutlined />}
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
          disabled={layoutLocked}
        />

        <FloorPlanCanvas
          tables={tables}
          gridRows={gridRows}
          gridCols={gridCols}
          selectedTableId={selectedTableId}
          editorMode={editorMode}
          disabled={layoutLocked}
          onCanvasClick={handleCanvasClick}
          onTableClick={handleTableClick}
          onTableDragEnd={handleTableDragEnd}
        />
      </div>
    </div>
  );
}
