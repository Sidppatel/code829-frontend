import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Space, App } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { adminLayoutApi } from '../../../services/api';
import { useFloorPlanStore, type FloorPlanElement } from '../../../stores/floorPlanStore';
import type { LayoutStatsResponse, TableStatusInfo, TableType } from '../../../types/layout';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import LayoutStatsBar from './components/LayoutStatsBar';
import GridConfigPanel from './components/GridConfigPanel';
import SeatingGrid from './components/SeatingGrid';
import TableDetailPanel from './components/TableDetailPanel';

export default function LayoutEditorPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { message } = App.useApp();

  // Server state
  const [tableTypes, setTableTypes] = useState<TableType[]>([]);
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());
  const [tableStatuses, setTableStatuses] = useState<Record<string, TableStatusInfo>>({});
  const [stats, setStats] = useState<LayoutStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkInsertLoading, setBulkInsertLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  // UI state
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  // Store
  const loadFromApi = useFloorPlanStore((s) => s.loadFromApi);
  const addElement = useFloorPlanStore((s) => s.addElement);
  const updateElement = useFloorPlanStore((s) => s.updateElement);
  const deleteElement = useFloorPlanStore((s) => s.deleteElement);
  const isDirty = useFloorPlanStore((s) => s.isDirty);
  const markClean = useFloorPlanStore((s) => s.markClean);
  const elements = useFloorPlanStore((s) => s.elements);
  const gridDimensions = useFloorPlanStore((s) => s.gridDimensions);

  // Draft save timer
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAll = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setStatsLoading(true);
    try {
      const [statusRes, lockedRes, typesRes, statsRes] = await Promise.all([
        adminLayoutApi.getLayoutStatus(eventId),
        adminLayoutApi.getLockedTables(eventId),
        adminLayoutApi.listTableTypes(),
        adminLayoutApi.getLayoutStats(eventId),
      ]);

      const statusData = statusRes.data;
      // Feed layout data into store
      loadFromApi({
        eventId,
        editorMode: 'grid',
        gridRows: statusData.gridRows ?? 0,
        gridCols: statusData.gridCols ?? 0,
        tables: (statusData.tables ?? []).map((t: TableStatusInfo) => ({
          id: t.id,
          label: t.label,
          capacity: t.capacity,
          shape: t.shape as FloorPlanElement['shape'],
          color: t.color,
          gridRow: t.gridRow,
          gridCol: t.gridCol,
          priceType: 'PerSeat' as const,
          priceCents: 0,
          isActive: true,
          sortOrder: 0,
        })),
      });

      // Also load full layout for complete table data (price, section, etc.)
      const layoutRes = await adminLayoutApi.getLayout(eventId);
      const fullTables = layoutRes.data.tables ?? [];
      loadFromApi({
        eventId,
        editorMode: 'grid',
        gridRows: layoutRes.data.gridRows ?? 0,
        gridCols: layoutRes.data.gridCols ?? 0,
        tables: fullTables,
      });

      setLockedIds(new Set(lockedRes.data.lockedTableIds ?? []));
      setTableTypes(typesRes.data ?? []);
      setStats(statsRes.data);

      // Build status lookup
      const statusMap: Record<string, TableStatusInfo> = {};
      for (const t of statusData.tables ?? []) {
        statusMap[t.id] = t;
      }
      setTableStatuses(statusMap);
    } catch {
      message.error('Failed to load layout');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, [eventId, loadFromApi, message]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Debounced draft auto-save
  useEffect(() => {
    if (!isDirty || !eventId) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const store = useFloorPlanStore.getState();
      const tables = Object.values(store.elements).map((el) => ({
        id: el.id,
        label: el.label,
        capacity: el.capacity,
        shape: el.shape,
        color: el.color,
        section: el.section,
        priceType: el.priceType,
        priceCents: el.priceCents,
        priceOverrideCents: el.priceOverrideCents,
        isActive: el.isActive,
        gridRow: el.gridRow,
        gridCol: el.gridCol,
        sortOrder: el.sortOrder,
        tableTypeId: el.tableTypeId,
      }));
      void adminLayoutApi.saveDraft(eventId, {
        editorMode: 'grid',
        gridRows: store.gridDimensions?.rows,
        gridCols: store.gridDimensions?.cols,
        tables,
      });
    }, 800);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [isDirty, eventId]);

  // Flush draft on unmount
  useEffect(() => {
    return () => {
      if (eventId && useFloorPlanStore.getState().isDirty) {
        void adminLayoutApi.flushDraft(eventId);
      }
    };
  }, [eventId]);

  // beforeunload warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (useFloorPlanStore.getState().isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const handleSaveLayout = async () => {
    if (!eventId) return;
    setSaving(true);
    try {
      const store = useFloorPlanStore.getState();
      const tables = Object.values(store.elements).map((el) => ({
        id: el.id,
        label: el.label,
        capacity: el.capacity,
        shape: el.shape,
        color: el.color,
        section: el.section,
        priceType: el.priceType,
        priceCents: el.priceCents,
        priceOverrideCents: el.priceOverrideCents,
        isActive: el.isActive,
        gridRow: el.gridRow,
        gridCol: el.gridCol,
        sortOrder: el.sortOrder,
        tableTypeId: el.tableTypeId,
      }));
      await adminLayoutApi.saveLayout(eventId, {
        editorMode: 'grid',
        gridRows: store.gridDimensions?.rows,
        gridCols: store.gridDimensions?.cols,
        tables,
      });
      markClean();
      message.success('Layout saved');
      // Refresh stats and status
      const [statsRes, statusRes] = await Promise.all([
        adminLayoutApi.getLayoutStats(eventId),
        adminLayoutApi.getLayoutStatus(eventId),
      ]);
      setStats(statsRes.data);
      const statusMap: Record<string, TableStatusInfo> = {};
      for (const t of statusRes.data.tables ?? []) {
        statusMap[t.id] = t;
      }
      setTableStatuses(statusMap);
    } catch {
      message.error('Failed to save layout');
    } finally {
      setSaving(false);
    }
  };

  const handleCellClick = useCallback(
    (row: number, col: number, element: FloorPlanElement | null) => {
      if (element) {
        // Clicking an existing table
        if (lockedIds.has(element.id)) {
          message.info('This table is locked due to active bookings');
          return;
        }
        setSelectedTableId(element.id);
        setSelectedTypeId(null);
        return;
      }

      // Empty cell
      if (!selectedTypeId) return;

      const tt = tableTypes.find((t) => t.id === selectedTypeId);
      if (!tt) return;

      const newId = crypto.randomUUID();
      const newElement: FloorPlanElement = {
        id: newId,
        label: tt.name,
        capacity: tt.defaultCapacity,
        shape: (tt.defaultShape as FloorPlanElement['shape']) ?? 'Round',
        color: tt.defaultColor,
        priceType: 'PerSeat',
        priceCents: tt.defaultPriceCents ?? 0,
        isActive: true,
        gridRow: row,
        gridCol: col,
        sortOrder: row * (gridDimensions?.cols ?? 0) + col,
        tableTypeId: tt.id,
        tableTypeName: tt.name,
      };
      addElement(newElement);
      setSelectedTableId(newId);
    },
    [selectedTypeId, tableTypes, lockedIds, gridDimensions, addElement, message],
  );

  const handleTableUpdate = useCallback(
    (patch: Partial<FloorPlanElement>) => {
      if (selectedTableId) {
        updateElement(selectedTableId, patch);
      }
    },
    [selectedTableId, updateElement],
  );

  const handleTableDelete = useCallback(() => {
    if (selectedTableId) {
      deleteElement(selectedTableId);
      setSelectedTableId(null);
    }
  }, [selectedTableId, deleteElement]);

  const handleBulkInsert = async () => {
    if (!eventId) return;
    setBulkInsertLoading(true);
    try {
      const unlinkedIds = tableTypes
        .filter((tt) => tt.isActive && !placedTypeIds.has(tt.id))
        .map((tt) => tt.id);
      if (unlinkedIds.length === 0) {
        message.info('All table types are already placed');
        return;
      }
      const res = await adminLayoutApi.bulkInsertTables(eventId, unlinkedIds);
      message.success(`Placed ${res.data.insertedCount} table(s)`);
      await loadAll();
    } catch {
      message.error('Failed to bulk insert tables');
    } finally {
      setBulkInsertLoading(false);
    }
  };

  const selectedTable = selectedTableId ? elements[selectedTableId] ?? null : null;

  const placedTypeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const el of Object.values(elements)) {
      if (el.tableTypeId) ids.add(el.tableTypeId);
    }
    return ids;
  }, [elements]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Layout Editor"
        subtitle={`${Object.keys(elements).length} tables on ${gridDimensions?.rows ?? 0}x${gridDimensions?.cols ?? 0} grid`}
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

      <LayoutStatsBar stats={stats} loading={statsLoading} />

      <div className="grid-editor-wrapper">
        <GridConfigPanel
          tableTypes={tableTypes}
          selectedTypeId={selectedTypeId}
          onSelectType={setSelectedTypeId}
          onBulkInsert={handleBulkInsert}
          bulkInsertLoading={bulkInsertLoading}
          placedTypeIds={placedTypeIds}
        />

        <div className="grid-editor-center">
          <SeatingGrid
            selectedTableId={selectedTableId}
            selectedTypeId={selectedTypeId}
            lockedIds={lockedIds}
            tableStatuses={tableStatuses}
            onCellClick={handleCellClick}
          />
        </div>

        <TableDetailPanel
          selectedTable={selectedTable}
          isLocked={selectedTableId ? lockedIds.has(selectedTableId) : false}
          onUpdate={handleTableUpdate}
          onDelete={handleTableDelete}
          onClose={() => setSelectedTableId(null)}
        />
      </div>
    </div>
  );
}
