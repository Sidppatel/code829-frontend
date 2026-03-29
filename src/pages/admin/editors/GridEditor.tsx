import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Circle, RectangleHorizontal, Square, Diamond, Save, Trash2, Tags, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../lib/axios';
import { useFloorPlanStore, type FloorPlanElement, type TableShape } from '../../../stores/floorPlanStore';
import { useEditorStore } from '../../../stores/editorStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TableType {
  id: string;
  name: string;
  defaultCapacity: number;
  defaultShape: TableShape;
  defaultColor: string;
  defaultPriceCents: number;
  isActive: boolean;
}

interface ContextMenuState {
  x: number;
  y: number;
  elementId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function colLabel(col: number): string {
  let label = '';
  let n = col;
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

function ShapeIcon({ shape, size = 16, fill }: { shape: TableShape; size?: number; fill?: string }): React.ReactElement {
  const props = fill ? { size, fill, strokeWidth: 1.5 } : { size };
  switch (shape) {
    case 'Round':
      return <Circle {...props} />;
    case 'Rectangle':
      return <RectangleHorizontal {...props} />;
    case 'Cocktail':
      return <Diamond {...props} />;
    case 'Square':
    default:
      return <Square {...props} />;
  }
}

function generateId(): string {
  return `el_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Table Cell ───────────────────────────────────────────────────────────────

interface TableCellProps {
  element: FloorPlanElement;
  isSelected: boolean;
  isBooked: boolean;
  onSelect: (id: string, evt: React.MouseEvent) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  onDragStart: (id: string) => void;
}

function TableCell({ element, isSelected, isBooked, onSelect, onContextMenu, onDragStart }: TableCellProps): React.ReactElement {
  const baseColor = isBooked ? 'var(--color-success)' : (element.color ?? 'var(--accent-primary)');

  return (
    <div
      draggable={!isBooked}
      onDragStart={isBooked ? undefined : () => onDragStart(element.id)}
      onClick={isBooked ? undefined : (e) => onSelect(element.id, e)}
      onContextMenu={isBooked ? undefined : (e) => {
        e.preventDefault();
        onContextMenu(element.id, e.clientX, e.clientY);
      }}
      title={isBooked ? `${element.label} — LOCKED (held or booked)` : element.label}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1px',
        cursor: isBooked ? 'not-allowed' : 'grab',
        padding: '3px',
        boxSizing: 'border-box',
        border: isBooked
          ? '2px solid var(--color-success)'
          : `2px solid ${isSelected ? 'var(--accent-primary)' : 'transparent'}`,
        borderRadius: '4px',
        background: isBooked
          ? 'color-mix(in srgb, var(--color-success) 12%, transparent)'
          : isSelected
          ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)'
          : 'transparent',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {/* Shape icon filled with element color */}
      <div style={{ color: baseColor }}>
        <ShapeIcon shape={element.shape} size={isBooked ? 16 : 20} fill={baseColor} />
      </div>
      {isBooked && (
        <span style={{ fontSize: '0.45rem', fontWeight: 800, color: 'var(--color-success)', letterSpacing: '0.06em', lineHeight: 1 }}>
          LOCKED
        </span>
      )}
      <span
        style={{
          fontSize: '0.6rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.1,
          textAlign: 'center',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {element.label}
      </span>
      <span
        style={{
          fontSize: '0.55rem',
          color: 'var(--text-tertiary)',
          lineHeight: 1,
        }}
      >
        {element.capacity}p
      </span>
    </div>
  );
}

// ─── Properties Panel ─────────────────────────────────────────────────────────

interface PropsPanelProps {
  element: FloorPlanElement;
  onUpdate: (id: string, patch: Partial<FloorPlanElement>) => void;
  onDelete: (id: string) => void;
}

function PropertiesPanel({ element, onUpdate, onDelete }: PropsPanelProps): React.ReactElement {
  const [localLabel, setLocalLabel] = useState(element.label);
  const [localSection, setLocalSection] = useState(element.section ?? '');
  const [localColor, setLocalColor] = useState(element.color ?? '');

  // Sync when a different element is selected
  useEffect(() => {
    queueMicrotask(() => {
      setLocalLabel(element.label);
      setLocalSection(element.section ?? '');
      setLocalColor(element.color ?? '');
    });
  }, [element.id, element.label, element.section, element.color]);

  function commitLabel(): void {
    onUpdate(element.id, { label: localLabel });
  }

  function commitSection(): void {
    onUpdate(element.id, { section: localSection || undefined });
  }

  function commitColor(): void {
    onUpdate(element.id, { color: localColor || undefined });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.9rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: 0,
        }}
      >
        Table Properties
      </h3>

      {/* Label */}
      <FieldRow label="Label">
        <input
          type="text"
          value={localLabel}
          onChange={(e) => setLocalLabel(e.target.value)}
          onBlur={commitLabel}
          onKeyDown={(e) => e.key === 'Enter' && commitLabel()}
          style={inputStyle}
        />
      </FieldRow>

      {/* Capacity */}
      <FieldRow label="Capacity">
        <input
          type="number"
          min={1}
          max={999}
          value={element.capacity}
          onChange={(e) => onUpdate(element.id, { capacity: Math.max(1, Number(e.target.value)) })}
          style={inputStyle}
        />
      </FieldRow>

      {/* Shape */}
      <FieldRow label="Shape">
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {(['Round', 'Rectangle', 'Square'] as TableShape[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onUpdate(element.id, { shape: s })}
              style={{
                padding: '0.3rem 0.5rem',
                borderRadius: '0.375rem',
                border: `1px solid ${element.shape === s ? 'var(--accent-primary)' : 'var(--border)'}`,
                background: element.shape === s
                  ? 'color-mix(in srgb, var(--accent-primary) 12%, var(--bg-secondary))'
                  : 'var(--bg-tertiary)',
                color: element.shape === s ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <ShapeIcon shape={s} size={12} fill={element.shape === s ? (element.color || undefined) : undefined} />
              {s}
            </button>
          ))}
        </div>
      </FieldRow>

      {/* Section */}
      <FieldRow label="Section">
        <input
          type="text"
          placeholder="e.g. VIP, Main Hall"
          value={localSection}
          onChange={(e) => setLocalSection(e.target.value)}
          onBlur={commitSection}
          onKeyDown={(e) => e.key === 'Enter' && commitSection()}
          style={inputStyle}
        />
      </FieldRow>

      {/* Color */}
      <FieldRow label="Fill Color">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="color"
            value={localColor || '#4f46e5'}
            onChange={(e) => { setLocalColor(e.target.value); }}
            onBlur={commitColor}
            style={{ width: '36px', height: '30px', border: '1px solid var(--border)', borderRadius: '0.375rem', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {localColor || '#4f46e5'}
          </span>
        </div>
      </FieldRow>

      {/* Price Type */}
      <FieldRow label="Price Type">
        <div style={{ display: 'flex', gap: '1rem' }}>
          {(['PerTable', 'PerSeat'] as const).map((pt) => (
            <label
              key={pt}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <input
                type="radio"
                name={`priceType_${element.id}`}
                checked={element.priceType === pt}
                onChange={() => onUpdate(element.id, { priceType: pt })}
                style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
              {pt === 'PerTable' ? 'Per Table' : 'Per Seat'}
            </label>
          ))}
        </div>
      </FieldRow>

      {/* Price */}
      <FieldRow label="Price ($)">
        <input
          type="number"
          min={0}
          step={0.01}
          value={(element.priceOverrideCents ?? element.priceCents) / 100}
          onChange={(e) =>
            onUpdate(element.id, {
              priceOverrideCents: Math.round(Number(e.target.value) * 100),
            })
          }
          style={inputStyle}
        />
      </FieldRow>

      {/* Status */}
      <FieldRow label="Status">
        <button
          type="button"
          onClick={() => onUpdate(element.id, { isActive: !element.isActive })}
          style={{
            padding: '0.3rem 0.875rem',
            borderRadius: '999px',
            border: 'none',
            background: element.isActive ? 'var(--color-success)' : 'var(--bg-tertiary)',
            color: element.isActive ? 'var(--bg-primary)' : 'var(--text-tertiary)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            transition: 'background 0.15s',
          }}
        >
          {element.isActive ? 'Available' : 'Inactive'}
        </button>
      </FieldRow>

      {/* Type name badge */}
      {element.tableTypeName && (
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          Type: {element.tableTypeName}
        </p>
      )}

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(element.id)}
        style={{
          marginTop: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--color-error)',
          background: 'transparent',
          color: 'var(--color-error)',
          cursor: 'pointer',
          fontSize: '0.8125rem',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'color-mix(in srgb, var(--color-error) 10%, transparent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <Trash2 size={14} />
        Delete Table
      </button>
    </div>
  );
}

// ─── Field Row ────────────────────────────────────────────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <label
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.4rem 0.625rem',
  borderRadius: '0.375rem',
  border: '1px solid var(--border)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.8125rem',
  outline: 'none',
  boxSizing: 'border-box',
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface GridEditorProps {
  eventId: string;
}

export default function GridEditor({ eventId }: GridEditorProps): React.ReactElement {
  const {
    elements,
    elementOrder,
    gridDimensions,
    isDirty,
    addElement,
    updateElement,
    deleteElement,
    moveElement,
    loadFromApi,
    setGridDimensions,
    markClean,
    clearAll,
  } = useFloorPlanStore();

  const { selectedIds, select, multiSelect, clearSelection } = useEditorStore();

  const [tableTypes, setTableTypes] = useState<TableType[]>([]);
  const [loadingLayout, setLoadingLayout] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [rowsInput, setRowsInput] = useState(10);
  const [colsInput, setColsInput] = useState(10);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [draggingFromPalette, setDraggingFromPalette] = useState<TableType | null>(null);
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  // Selected empty cells for bulk placement (stored as "row-col" keys)
  const [selectedEmptyCells, setSelectedEmptyCells] = useState<Set<string>>(new Set());
  // Booked tables: IDs of tables that have been sold (cannot be edited/removed)
  const [bookedTableIds, setBookedTableIds] = useState<Set<string>>(new Set());
  const [bookedRevenueCents, setBookedRevenueCents] = useState(0);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Rubber-band / marquee selection state
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; currX: number; currY: number } | null>(null);
  const marqueeRef = useRef<{ startX: number; startY: number } | null>(null);

  // Bulk Insert state
  const [showBulkInsert, setShowBulkInsert] = useState(false);
  const [bulkInsertType, setBulkInsertType] = useState<string>('');
  const [bulkInsertCount, setBulkInsertCount] = useState(5);
  const [bulkFillMode, setBulkFillMode] = useState<'left-to-right' | 'specific-row'>('left-to-right');
  const [bulkTargetRow, setBulkTargetRow] = useState(0);

  // Event Overrides state (FIX 6)
  const [overridesEnabled] = useState(false);
  const [overrides] = useState<Record<string, { priceCents: number; capacity: number }>>({});
  // Inline edit mode for table types in the palette
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeData, setEditingTypeData] = useState<{ name: string; shape: TableShape; capacity: number; priceCents: number; color: string } | null>(null);

  const rows = gridDimensions?.rows ?? 10;
  const cols = gridDimensions?.cols ?? 10;

  // Load table types
  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      try {
        const res = await apiClient.get<TableType[]>('/admin/table-types');
        if (!cancelled) setTableTypes(res.data.filter((t) => t.isActive));
      } catch {
        if (!cancelled) toast.error('Failed to load table types');
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  // Load layout: check Redis draft first, fall back to DB
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    async function load(): Promise<void> {
      setLoadingLayout(true);
      try {
        // Check for Redis draft first
        const draftRes = await apiClient.get(`/admin/events/${eventId}/layout/draft`);
        if (!cancelled && draftRes.data.source === 'redis' && draftRes.data.data) {
          const draft = draftRes.data.data;
          // Reconstruct the layout response shape for loadFromApi
          loadFromApi({
            eventId,
            editorMode: draft.editorMode,
            gridRows: draft.gridRows,
            gridCols: draft.gridCols,
            tables: draft.tables.map((t: Record<string, unknown>) => ({
              ...t, tableTypeName: (t.tableTypeName as string) ?? null,
            })),
          });
          setRowsInput(draft.gridRows ?? 10);
          setColsInput(draft.gridCols ?? 10);
          return;
        }
        // Fall back to DB
        const res = await apiClient.get(`/admin/events/${eventId}/layout`);
        if (!cancelled) {
          loadFromApi(res.data);
          setRowsInput(res.data.gridRows ?? 10);
          setColsInput(res.data.gridCols ?? 10);
        }
      } catch {
        if (!cancelled) {
          setGridDimensions(10, 10);
        }
      } finally {
        if (!cancelled) setLoadingLayout(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Fetch locked table IDs (active holds + booked seats)
  useEffect(() => {
    if (!eventId) return;
    apiClient.get<{ lockedTableIds: string[] }>(`/admin/events/${eventId}/layout/locked`)
      .then((res) => {
        setBookedTableIds(new Set(res.data.lockedTableIds));
      })
      .catch(() => { /* ignore */ });

    // Also fetch booking stats for revenue display
    apiClient.get(`/admin/bookings/stats?eventId=${eventId}`)
      .then((res) => {
        const data = res.data as { revenue: number };
        setBookedRevenueCents(data.revenue ?? 0);
      })
      .catch(() => { /* ignore */ });
  }, [eventId]);

  // Close context menu on outside click
  useEffect(() => {
    function handleClick(): void {
      setContextMenu(null);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Auto-save: 2s debounce after any change
  useEffect(() => {
    if (!isDirty) return;
    setSaveStatus('idle');
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void performAutoSave();
    }, 2000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, elements, elementOrder]);

  // Stats
  const allElements = elementOrder.map((id) => elements[id]).filter(Boolean);
  const totalTables = allElements.length;
  const totalSeats = allElements.reduce((acc, el) => acc + el.capacity, 0);

  // Revenue: total if all tables sold (sum of each table's price)
  const totalRevenueCents = allElements.reduce((acc, el) => {
    const price = el.priceOverrideCents ?? el.priceCents;
    return acc + price;
  }, 0);
  const bookedTablesCount = bookedTableIds.size;

  // Cell occupancy map: "row-col" -> elementId
  const occupancyMap = new Map<string, string>();
  for (const el of allElements) {
    if (el.gridRow !== undefined && el.gridCol !== undefined) {
      occupancyMap.set(`${el.gridRow}-${el.gridCol}`, el.id);
    }
  }

  function handleApplyDimensions(): void {
    setGridDimensions(rowsInput, colsInput);
  }

  function handleCellDrop(row: number, col: number): void {
    const key = `${row}-${col}`;
    if (occupancyMap.has(key)) return; // cell already occupied

    if (draggingElementId) {
      moveElement(draggingElementId, row, col);
      setDraggingElementId(null);
    } else if (draggingFromPalette) {
      const tt = draggingFromPalette;
      const ovr = overridesEnabled ? overrides[tt.id] : undefined;
      const el: FloorPlanElement = {
        id: generateId(),
        label: `T${totalTables + 1}`,
        capacity: ovr?.capacity ?? tt.defaultCapacity,
        shape: tt.defaultShape,
        color: tt.defaultColor,
        section: undefined,
        priceType: 'PerTable',
        priceCents: ovr?.priceCents ?? tt.defaultPriceCents,
        isActive: true,
        gridRow: row,
        gridCol: col,
        sortOrder: totalTables,
        tableTypeId: tt.id,
        tableTypeName: tt.name,
      };
      addElement(el);
      setDraggingFromPalette(null);
    }
  }

  function handleSelectCell(id: string, evt: React.MouseEvent): void {
    evt.stopPropagation();
    setSelectedEmptyCells(new Set()); // clear empty cell selection when selecting occupied
    if (evt.shiftKey) {
      multiSelect(id);
    } else {
      select(id);
    }
  }

  function handleSelectEmptyCell(row: number, col: number, evt: React.MouseEvent): void {
    evt.stopPropagation();
    // Don't fire if we just finished a marquee drag
    if (marqueeRef.current) return;
    clearSelection(); // clear occupied selection when selecting empty
    const key = `${row}-${col}`;
    setSelectedEmptyCells((prev) => {
      const next = new Set(prev);
      if (evt.shiftKey) {
        if (next.has(key)) next.delete(key); else next.add(key);
      } else {
        if (next.has(key) && next.size === 1) { next.clear(); } else { next.clear(); next.add(key); }
      }
      return next;
    });
  }

  // ── Marquee (rubber-band) selection ──────────────────────────────────────
  function handleMarqueeStart(e: React.MouseEvent<HTMLDivElement>): void {
    // Start marquee from anywhere in the grid (cells or background)
    if (e.button !== 0) return; // left click only
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left + (gridRef.current?.scrollLeft ?? 0);
    const y = e.clientY - rect.top + (gridRef.current?.scrollTop ?? 0);
    marqueeRef.current = { startX: x, startY: y };
    setMarquee({ startX: x, startY: y, currX: x, currY: y });
    // Clear previous selections unless shift is held
    if (!e.shiftKey) {
      clearSelection();
      setSelectedEmptyCells(new Set());
    }
  }

  function handleMarqueeMove(e: React.MouseEvent<HTMLDivElement>): void {
    if (!marqueeRef.current || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + gridRef.current.scrollLeft;
    const y = e.clientY - rect.top + gridRef.current.scrollTop;
    setMarquee({ startX: marqueeRef.current.startX, startY: marqueeRef.current.startY, currX: x, currY: y });
  }

  function handleMarqueeEnd(): void {
    if (!marquee || !gridRef.current) {
      marqueeRef.current = null;
      setMarquee(null);
      return;
    }

    // If the drag distance is tiny (< 5px), it was a click not a drag — ignore
    const dx = Math.abs(marquee.currX - marquee.startX);
    const dy = Math.abs(marquee.currY - marquee.startY);
    if (dx < 5 && dy < 5) {
      marqueeRef.current = null;
      setMarquee(null);
      return;
    }

    // Calculate the selection rectangle in grid coordinates
    // Grid layout: 28px row header + (64px cell + 2px gap) per col, 20px col header + (64px cell + 2px gap) per row
    const cellSize = 64;
    const gap = 2;
    const headerW = 28;
    const headerH = 20;

    const left = Math.min(marquee.startX, marquee.currX);
    const right = Math.max(marquee.startX, marquee.currX);
    const top = Math.min(marquee.startY, marquee.currY);
    const bottom = Math.max(marquee.startY, marquee.currY);

    const newEmpty = new Set(selectedEmptyCells);
    const newOccupied: string[] = [...selectedIds];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Cell position in the grid
        const cellLeft = headerW + c * (cellSize + gap);
        const cellTop = headerH + r * (cellSize + gap);
        const cellRight = cellLeft + cellSize;
        const cellBottom = cellTop + cellSize;

        // Check overlap with marquee rectangle
        if (cellRight > left && cellLeft < right && cellBottom > top && cellTop < bottom) {
          const key = `${r}-${c}`;
          const occupantId = occupancyMap.get(key);
          if (occupantId) {
            if (!newOccupied.includes(occupantId)) newOccupied.push(occupantId);
          } else {
            newEmpty.add(key);
          }
        }
      }
    }

    // Select both occupied and empty cells from the marquee
    if (newOccupied.length > 0) {
      useEditorStore.setState({ selectedIds: newOccupied });
    } else {
      clearSelection();
    }
    setSelectedEmptyCells(newEmpty);

    marqueeRef.current = null;
    setMarquee(null);
  }

  // Apply a table type to all selected empty cells
  function handleApplyTypeToSelected(tt: TableType): void {
    if (selectedEmptyCells.size === 0 && selectedIds.length === 0) {
      toast.error('Select cells first, then click a table type');
      return;
    }

    const msgs: string[] = [];

    // If empty cells are selected, place tables there
    if (selectedEmptyCells.size > 0) {
      const ovr = overridesEnabled ? overrides[tt.id] : undefined;
      let placed = 0;
      const sortedCells = [...selectedEmptyCells].sort();
      for (const key of sortedCells) {
        const [r, c] = key.split('-').map(Number);
        if (occupancyMap.has(key)) continue;
        const el: FloorPlanElement = {
          id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${placed}`,
          label: `${colLabel(c)}${r + 1}`,
          capacity: ovr?.capacity ?? tt.defaultCapacity,
          shape: tt.defaultShape,
          color: tt.defaultColor,
          section: undefined,
          priceType: 'PerTable',
          priceCents: ovr?.priceCents ?? tt.defaultPriceCents,
          isActive: true,
          gridRow: r,
          gridCol: c,
          sortOrder: totalTables + placed,
          tableTypeId: tt.id,
          tableTypeName: tt.name,
        };
        addElement(el);
        placed++;
      }
      setSelectedEmptyCells(new Set());
      if (placed > 0) msgs.push(`Placed ${placed}`);
    }

    // Also change occupied cells to this type
    if (selectedIds.length > 0) {
      for (const id of selectedIds) {
        updateElement(id, {
          capacity: tt.defaultCapacity,
          shape: tt.defaultShape,
          color: tt.defaultColor,
          priceCents: tt.defaultPriceCents,
          tableTypeId: tt.id,
          tableTypeName: tt.name,
        });
      }
      msgs.push(`Changed ${selectedIds.length}`);
      clearSelection();
    }

    if (msgs.length > 0) toast.success(`${msgs.join(', ')} ${tt.name} table${(selectedEmptyCells.size + selectedIds.length) > 1 ? 's' : ''}`);
  }

  function handleDelete(id: string): void {
    if (bookedTableIds.has(id)) {
      toast.error('Cannot delete a table with active holds or bookings');
      return;
    }
    deleteElement(id);
    clearSelection();
    setContextMenu(null);
  }

  const handleAutoLabel = useCallback((): void => {
    const sorted = [...allElements].sort((a, b) => {
      const ra = a.gridRow ?? 0;
      const rb = b.gridRow ?? 0;
      if (ra !== rb) return ra - rb;
      return (a.gridCol ?? 0) - (b.gridCol ?? 0);
    });
    sorted.forEach((el, idx) => {
      if (!bookedTableIds.has(el.id)) {
        updateElement(el.id, { label: `T${idx + 1}` });
      }
    });
    toast.success('Tables auto-labeled');
  }, [allElements, updateElement, bookedTableIds]);

  function buildLayoutPayload(): { editorMode: string; gridRows: number; gridCols: number; tables: Record<string, unknown>[] } {
    return {
      editorMode: 'grid',
      gridRows: rows,
      gridCols: cols,
      tables: elementOrder.map((id, idx) => {
        const el = elements[id];
        return {
          id: el.id, label: el.label, capacity: el.capacity, shape: el.shape,
          color: el.color, section: el.section, priceType: el.priceType,
          priceCents: el.priceOverrideCents ?? el.priceCents, isActive: el.isActive,
          gridRow: el.gridRow, gridCol: el.gridCol,
          sortOrder: idx, tableTypeId: el.tableTypeId,
        };
      }),
    };
  }

  // Auto-save: try Redis draft first (fast), fall back to direct DB save
  async function performAutoSave(): Promise<void> {
    setSaveStatus('saving');
    try {
      await apiClient.post(`/admin/events/${eventId}/layout/draft`, buildLayoutPayload());
      setSaveStatus('saved');
    } catch {
      // Redis draft failed — try direct DB save as fallback
      try {
        await apiClient.post(`/admin/events/${eventId}/layout`, buildLayoutPayload());
        markClean();
        setSaveStatus('saved');
      } catch {
        setSaveStatus('idle');
      }
    }
  }

  // Bulk Insert
  function handleBulkInsert(): void {
    const tt = tableTypes.find((t) => t.id === bulkInsertType);
    if (!tt) { toast.error('Select a table type'); return; }
    const count = Math.min(20, Math.max(1, bulkInsertCount));

    // Collect empty cells
    const emptyCells: Array<{ row: number; col: number }> = [];
    if (bulkFillMode === 'specific-row') {
      const r = Math.min(bulkTargetRow, rows - 1);
      for (let c = 0; c < cols && emptyCells.length < count; c++) {
        if (!occupancyMap.has(`${r}-${c}`)) {
          emptyCells.push({ row: r, col: c });
        }
      }
    } else {
      for (let r = 0; r < rows && emptyCells.length < count; r++) {
        for (let c = 0; c < cols && emptyCells.length < count; c++) {
          if (!occupancyMap.has(`${r}-${c}`)) {
            emptyCells.push({ row: r, col: c });
          }
        }
      }
    }

    if (emptyCells.length === 0) {
      toast.error('No empty cells available');
      return;
    }

    const actualCount = Math.min(count, emptyCells.length);
    for (let i = 0; i < actualCount; i++) {
      const { row, col } = emptyCells[i];
      const el: FloorPlanElement = {
        id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${i}`,
        label: `T${totalTables + i + 1}`,
        capacity: (overridesEnabled && overrides[tt.id]?.capacity) ? overrides[tt.id].capacity : tt.defaultCapacity,
        shape: tt.defaultShape,
        color: tt.defaultColor,
        section: undefined,
        priceType: 'PerTable',
        priceCents: (overridesEnabled && overrides[tt.id]?.priceCents !== undefined) ? overrides[tt.id].priceCents : tt.defaultPriceCents,
        isActive: true,
        gridRow: row,
        gridCol: col,
        sortOrder: totalTables + i,
        tableTypeId: tt.id,
        tableTypeName: tt.name,
      };
      addElement(el);
    }
    toast.success(`Inserted ${actualCount} tables`);
    setShowBulkInsert(false);
  }

  // Bulk Remove — skip booked tables
  function handleBulkRemove(): void {
    const removable = selectedIds.filter((id) => !bookedTableIds.has(id));
    const bookedSkipped = selectedIds.length - removable.length;
    if (removable.length === 0) {
      toast.error('All selected tables are sold and cannot be removed');
      return;
    }
    const msg = bookedSkipped > 0
      ? `Remove ${removable.length} table${removable.length > 1 ? 's' : ''}? (${bookedSkipped} sold table${bookedSkipped > 1 ? 's' : ''} will be skipped)`
      : `Remove ${removable.length} selected table${removable.length > 1 ? 's' : ''}?`;
    if (!window.confirm(msg)) return;
    for (const id of removable) {
      deleteElement(id);
    }
    clearSelection();
    toast.success(`Removed ${removable.length} table${removable.length > 1 ? 's' : ''}`);
  }

  // Select All placed tables
  function handleSelectAll(checked: boolean): void {
    if (checked) {
      // Select all placed elements
      if (allElements.length > 0) {
        useEditorStore.setState({ selectedIds: allElements.map((el) => el.id) });
      }
    } else {
      clearSelection();
    }
  }

  async function handleSave(): Promise<void> {
    setSaving(true);
    try {
      // Try Redis draft + flush first
      try {
        await apiClient.post(`/admin/events/${eventId}/layout/draft`, buildLayoutPayload());
        await apiClient.post(`/admin/events/${eventId}/layout/flush`);
      } catch {
        // Fallback: save directly to DB
        await apiClient.post(`/admin/events/${eventId}/layout`, buildLayoutPayload());
      }
      markClean();
      setSaveStatus('saved');
      toast.success('Layout saved');
    } catch {
      toast.error('Failed to save layout');
    } finally {
      setSaving(false);
    }
  }

  function handleClearAll(): void {
    if (!window.confirm('Clear all tables from this layout? This cannot be undone.')) return;
    clearAll();
    clearSelection();
  }

  const selectedId = selectedIds[0] ?? null;
  const selectedElement = selectedId ? elements[selectedId] : null;

  if (loadingLayout) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Loading layout…</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        minHeight: '600px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        position: 'relative',
      }}
      onClick={() => clearSelection()}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {/* ── Left Panel: Table Palette ─────────────────────────────────── */}
      <div
        style={{
          width: '220px',
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '0.875rem 1rem',
            borderBottom: '1px solid var(--border)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Table Types
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {tableTypes.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0, textAlign: 'center', padding: '1rem 0' }}>
              No active table types
            </p>
          )}
          {/* Hint when cells are selected */}
          {(selectedEmptyCells.size > 0 || selectedIds.length > 0) && (
            <p style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', margin: '0 0 0.5rem', padding: '0.4rem 0.5rem', background: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)', borderRadius: '0.375rem', lineHeight: 1.3 }}>
              {selectedEmptyCells.size > 0 && selectedIds.length > 0
                ? `${selectedEmptyCells.size} empty + ${selectedIds.length} table${selectedIds.length > 1 ? 's' : ''} — click type to fill & change`
                : selectedEmptyCells.size > 0
                ? `${selectedEmptyCells.size} cell${selectedEmptyCells.size > 1 ? 's' : ''} selected — click a type to place`
                : `${selectedIds.length} table${selectedIds.length > 1 ? 's' : ''} selected — click a type to change`}
            </p>
          )}
          {tableTypes.map((tt) => {
            const isEditing = editingTypeId === tt.id;
            const hasSelection = selectedEmptyCells.size > 0 || selectedIds.length > 0;

            if (isEditing) {
              return (
                <div
                  key={tt.id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '2px solid var(--accent-primary)',
                    background: 'color-mix(in srgb, var(--accent-primary) 5%, var(--bg-tertiary))',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Edit Type
                  </div>
                  {/* Name */}
                  <div style={{ marginBottom: '0.375rem' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.15rem', textTransform: 'uppercase' }}>Name</div>
                    <input
                      type="text"
                      value={editingTypeData?.name ?? ''}
                      onChange={(e) => setEditingTypeData((p) => p ? { ...p, name: e.target.value } : p)}
                      style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
                    />
                    {editingTypeData?.name && tableTypes.some((t) => t.id !== tt.id && t.name.toLowerCase() === editingTypeData.name.toLowerCase()) && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-error)', marginTop: '0.15rem' }}>A type with this name already exists</div>
                    )}
                  </div>
                  {/* Shape selector — filled icons */}
                  <div style={{ marginBottom: '0.375rem' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.15rem', textTransform: 'uppercase' }}>Shape</div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {(['Round', 'Rectangle', 'Square', 'Cocktail'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setEditingTypeData((p) => p ? { ...p, shape: s } : p)}
                          style={{
                            flex: 1,
                            padding: '0.4rem',
                            borderRadius: '0.375rem',
                            border: `1.5px solid ${editingTypeData?.shape === s ? 'var(--accent-primary)' : 'var(--border)'}`,
                            background: editingTypeData?.shape === s ? 'color-mix(in srgb, var(--accent-primary) 12%, transparent)' : 'var(--bg-secondary)',
                            color: editingTypeData?.shape === s ? (editingTypeData.color || 'var(--accent-primary)') : 'var(--text-tertiary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ShapeIcon shape={s} size={16} fill={editingTypeData?.shape === s ? (editingTypeData.color || undefined) : undefined} />
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Fill Color */}
                  <div style={{ marginBottom: '0.375rem' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.15rem', textTransform: 'uppercase' }}>Fill Color</div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={editingTypeData?.color || '#4f46e5'}
                        onChange={(e) => setEditingTypeData((p) => p ? { ...p, color: e.target.value } : p)}
                        style={{ width: '100%', height: '32px', border: '1px solid var(--border)', borderRadius: '0.375rem', cursor: 'pointer', padding: '2px' }}
                      />
                    </div>
                  </div>
                  {/* Seats + Price side by side */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.15rem', textTransform: 'uppercase' }}>Seats</div>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={editingTypeData?.capacity ?? ''}
                        onChange={(e) => setEditingTypeData((p) => p ? { ...p, capacity: Number(e.target.value) } : p)}
                        style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.15rem', textTransform: 'uppercase' }}>Price ($)</div>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={editingTypeData?.priceCents !== undefined ? editingTypeData.priceCents / 100 : ''}
                        onChange={(e) => setEditingTypeData((p) => p ? { ...p, priceCents: Math.round(Number(e.target.value) * 100) } : p)}
                        style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  {/* Save / Cancel */}
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button
                      type="button"
                      disabled={!editingTypeData?.name || tableTypes.some((t) => t.id !== tt.id && t.name.toLowerCase() === (editingTypeData?.name ?? '').toLowerCase())}
                      onClick={() => {
                        if (editingTypeData) {
                          const isDuplicate = tableTypes.some((t) => t.id !== tt.id && t.name.toLowerCase() === editingTypeData.name.toLowerCase());
                          if (isDuplicate) { toast.error('A type with this name already exists'); return; }
                          apiClient.put(`/admin/table-types/${tt.id}`, {
                            name: editingTypeData.name,
                            defaultCapacity: editingTypeData.capacity,
                            defaultShape: editingTypeData.shape,
                            defaultColor: editingTypeData.color,
                            defaultPriceCents: editingTypeData.priceCents,
                          }).then(() => {
                            setTableTypes((prev) => prev.map((t) =>
                              t.id === tt.id ? { ...t, name: editingTypeData.name, defaultCapacity: editingTypeData.capacity, defaultShape: editingTypeData.shape, defaultColor: editingTypeData.color, defaultPriceCents: editingTypeData.priceCents } : t
                            ));
                            toast.success('Type updated');
                          }).catch(() => toast.error('Failed to update'));
                        }
                        setEditingTypeId(null);
                        setEditingTypeData(null);
                      }}
                      style={{ flex: 1, padding: '0.35rem', borderRadius: '0.375rem', border: 'none', background: 'var(--accent-primary)', color: 'var(--bg-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingTypeId(null); setEditingTypeData(null); }}
                      style={{ flex: 1, padding: '0.35rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={tt.id}
                draggable={hasSelection ? undefined : true}
                onDragStart={hasSelection ? undefined : () => setDraggingFromPalette(tt)}
                onDragEnd={hasSelection ? undefined : () => setDraggingFromPalette(null)}
                onClick={() => {
                  if (hasSelection) {
                    handleApplyTypeToSelected(tt);
                  } else {
                    setEditingTypeId(tt.id);
                    setEditingTypeData({ name: tt.name, shape: tt.defaultShape, capacity: tt.defaultCapacity, priceCents: tt.defaultPriceCents, color: tt.defaultColor || '' });
                  }
                }}
                style={{
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  marginBottom: '0.5rem',
                  transition: 'border-color 0.15s, background 0.15s',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                {/* Row 1: Shape icon + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <div style={{ color: tt.defaultColor || 'var(--accent-primary)', flexShrink: 0 }}>
                    <ShapeIcon shape={tt.defaultShape} size={18} fill={tt.defaultColor || undefined} />
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {tt.name}
                  </div>
                </div>
                {/* Row 2: Seats + Price */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '1.625rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {tt.defaultCapacity} seat{tt.defaultCapacity !== 1 ? 's' : ''}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>·</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                    ${(tt.defaultPriceCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Center: Grid ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Toolbar */}
        <div
          style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Dimensions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={smallLabelStyle}>Rows</label>
            <input
              type="number"
              min={1}
              max={30}
              value={rowsInput}
              onChange={(e) => setRowsInput(Math.min(30, Math.max(1, Number(e.target.value))))}
              style={{ ...smallInputStyle, width: '52px' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>×</span>
            <label style={smallLabelStyle}>Cols</label>
            <input
              type="number"
              min={1}
              max={30}
              value={colsInput}
              onChange={(e) => setColsInput(Math.min(30, Math.max(1, Number(e.target.value))))}
              style={{ ...smallInputStyle, width: '52px' }}
            />
            <button
              type="button"
              onClick={handleApplyDimensions}
              style={toolbarBtnStyle}
            >
              Apply
            </button>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />

          {/* Stats + Revenue */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span>
              <strong style={{ color: 'var(--text-primary)' }}>{totalTables}</strong> tables
              {' · '}
              <strong style={{ color: 'var(--text-primary)' }}>{totalSeats}</strong> seats
            </span>
            <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
            <span title="Total revenue if all tables are sold">
              Potential:{' '}
              <strong style={{ color: 'var(--color-success)' }}>
                ${(totalRevenueCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </span>
            {bookedTablesCount > 0 && (
              <>
                <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                <span title="Tables that have been sold (locked from editing)">
                  Sold:{' '}
                  <strong style={{ color: 'var(--color-success)' }}>
                    {bookedTablesCount}/{totalTables}
                  </strong>
                  {' tables · '}
                  <strong style={{ color: 'var(--accent-primary)' }}>
                    ${(bookedRevenueCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                  {' revenue'}
                </span>
              </>
            )}
          </div>

          {/* Select All */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={totalTables > 0 && selectedIds.length === totalTables}
              onChange={(e) => handleSelectAll(e.target.checked)}
              style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
            All
          </label>

          <div style={{ flex: 1 }} />

          {/* Auto-save status */}
          {saveStatus === 'saving' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
              Saving…
            </span>
          )}
          {saveStatus === 'saved' && !isDirty && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--color-success)' }}>
              <Check size={12} />
              All changes saved
            </span>
          )}
          {isDirty && saveStatus === 'idle' && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Unsaved changes
            </span>
          )}

          {/* Actions */}
          <button
            type="button"
            onClick={handleAutoLabel}
            style={toolbarBtnStyle}
            title="Auto-label tables in grid order"
          >
            <Tags size={14} />
            Auto-label
          </button>

          {/* Delete selected — trash icon, enabled when any table is selected */}
          <button
            type="button"
            onClick={handleBulkRemove}
            disabled={selectedIds.length === 0}
            title={selectedIds.length > 0 ? `Delete ${selectedIds.length} selected table${selectedIds.length > 1 ? 's' : ''}` : 'Select tables to delete'}
            style={{
              ...toolbarBtnStyle,
              borderColor: selectedIds.length > 0 ? 'var(--color-error)' : 'var(--border)',
              color: selectedIds.length > 0 ? 'var(--color-error)' : 'var(--text-tertiary)',
              opacity: selectedIds.length > 0 ? 1 : 0.4,
              cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            <Trash2 size={14} />
            {selectedIds.length > 0 ? selectedIds.length : ''}
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            style={{ ...toolbarBtnStyle, borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
          >
            <Trash2 size={14} />
            Clear All
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            style={{
              ...toolbarBtnStyle,
              background: isDirty ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              color: isDirty ? 'var(--bg-primary)' : 'var(--text-tertiary)',
              borderColor: isDirty ? 'var(--accent-primary)' : 'var(--border)',
              opacity: saving ? 0.7 : 1,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* Bulk Insert Panel */}
        {showBulkInsert && (
          <div
            style={{
              padding: '0.875rem 1rem',
              borderBottom: '1px solid var(--border)',
              background: 'color-mix(in srgb, var(--accent-primary) 5%, var(--bg-secondary))',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            {/* Table Type */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Table Type
              </label>
              <select
                value={bulkInsertType}
                onChange={(e) => setBulkInsertType(e.target.value)}
                style={{
                  padding: '0.35rem 0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              >
                <option value="">— select —</option>
                {tableTypes.map((tt) => (
                  <option key={tt.id} value={tt.id}>{tt.name}</option>
                ))}
              </select>
            </div>

            {/* Count */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Count (1–20)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={bulkInsertCount}
                onChange={(e) => setBulkInsertCount(Math.min(20, Math.max(1, Number(e.target.value))))}
                style={{ ...smallInputStyle, width: '60px' }}
              />
            </div>

            {/* Fill mode */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Fill Mode
              </label>
              <select
                value={bulkFillMode}
                onChange={(e) => setBulkFillMode(e.target.value as 'left-to-right' | 'specific-row')}
                style={{
                  padding: '0.35rem 0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              >
                <option value="left-to-right">Fill empty cells left-to-right</option>
                <option value="specific-row">Fill specific row</option>
              </select>
            </div>

            {/* Row selector (only for specific-row) */}
            {bulkFillMode === 'specific-row' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Row
                </label>
                <input
                  type="number"
                  min={0}
                  max={rows - 1}
                  value={bulkTargetRow}
                  onChange={(e) => setBulkTargetRow(Math.min(rows - 1, Math.max(0, Number(e.target.value))))}
                  style={{ ...smallInputStyle, width: '60px' }}
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleBulkInsert}
              style={{
                ...toolbarBtnStyle,
                background: 'var(--accent-primary)',
                color: 'var(--bg-primary)',
                borderColor: 'var(--accent-primary)',
              }}
            >
              Insert
            </button>
            <button
              type="button"
              onClick={() => setShowBulkInsert(false)}
              style={toolbarBtnStyle}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Grid with marquee selection */}
        <div
          ref={gridRef}
          style={{ flex: 1, overflow: 'auto', padding: '1rem', position: 'relative', userSelect: 'none' }}
          onMouseDown={handleMarqueeStart}
          onMouseMove={handleMarqueeMove}
          onMouseUp={handleMarqueeEnd}
          onMouseLeave={handleMarqueeEnd}
        >
          {/* Marquee overlay */}
          {marquee && (
            <div
              style={{
                position: 'absolute',
                left: Math.min(marquee.startX, marquee.currX),
                top: Math.min(marquee.startY, marquee.currY),
                width: Math.abs(marquee.currX - marquee.startX),
                height: Math.abs(marquee.currY - marquee.startY),
                background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
                border: '1px solid var(--accent-primary)',
                borderRadius: '2px',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            />
          )}
          <div
            style={{
              display: 'inline-grid',
              gridTemplateColumns: `28px repeat(${cols}, 64px)`,
              gridTemplateRows: `20px repeat(${rows}, 64px)`,
              gap: '2px',
            }}
          >
            {/* Corner cell */}
            <div />

            {/* Column headers */}
            {Array.from({ length: cols }, (_, c) => (
              <div
                key={`ch-${c}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.04em',
                }}
              >
                {colLabel(c)}
              </div>
            ))}

            {/* Row headers + cells */}
            {Array.from({ length: rows }, (_, r) => (
              <React.Fragment key={`row-${r}`}>
                {/* Row header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: 'var(--text-tertiary)',
                  }}
                >
                  {r + 1}
                </div>

                {/* Cells */}
                {Array.from({ length: cols }, (_, c) => {
                  const key = `${r}-${c}`;
                  const occupantId = occupancyMap.get(key);
                  const occupant = occupantId ? elements[occupantId] : undefined;
                  const isSelected = occupantId ? selectedIds.includes(occupantId) : false;
                  const isEmptySelected = !occupant && selectedEmptyCells.has(key);

                  return (
                    <div
                      key={`cell-${r}-${c}`}
                      data-cell="true"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.stopPropagation();
                        handleCellDrop(r, c);
                      }}
                      onClick={!occupant ? (e) => handleSelectEmptyCell(r, c, e) : undefined}
                      style={{
                        width: '64px',
                        height: '64px',
                        border: occupant
                          ? `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border)'}`
                          : isEmptySelected
                          ? '2px solid var(--accent-primary)'
                          : '1px dashed var(--border)',
                        borderRadius: '4px',
                        background: occupant
                          ? 'var(--bg-secondary)'
                          : isEmptySelected
                          ? 'color-mix(in srgb, var(--accent-primary) 8%, transparent)'
                          : 'transparent',
                        position: 'relative',
                        transition: 'border-color 0.1s, background 0.1s',
                        boxSizing: 'border-box',
                        cursor: !occupant ? 'pointer' : 'default',
                      }}
                    >
                      {occupant ? (
                        <TableCell
                          element={occupant}
                          isSelected={isSelected}
                          isBooked={bookedTableIds.has(occupant.id)}
                          onSelect={handleSelectCell}
                          onContextMenu={(id, x, y) => setContextMenu({ x, y, elementId: id })}
                          onDragStart={(id) => setDraggingElementId(id)}
                        />
                      ) : isEmptySelected ? (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={14} style={{ color: 'var(--accent-primary)', opacity: 0.5 }} />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Properties ───────────────────────────────────── */}
      <div
        style={{
          width: '300px',
          flexShrink: 0,
          borderLeft: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '0.875rem 1rem',
            borderBottom: '1px solid var(--border)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Properties
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {selectedElement ? (
            <PropertiesPanel
              element={selectedElement}
              onUpdate={updateElement}
              onDelete={handleDelete}
            />
          ) : (
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-tertiary)',
                textAlign: 'center',
                padding: '2rem 0',
                margin: 0,
              }}
            >
              Select a table to edit properties
            </p>
          )}
        </div>
      </div>

      {/* ── Context Menu ─────────────────────────────────────────────── */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            boxShadow: 'var(--shadow-card-hover)',
            zIndex: 999,
            minWidth: '140px',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => handleDelete(contextMenu.elementId)}
            style={{
              width: '100%',
              padding: '0.625rem 1rem',
              border: 'none',
              background: 'none',
              color: 'var(--color-error)',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-body)',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'color-mix(in srgb, var(--color-error) 8%, transparent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            <Trash2 size={13} />
            Delete Table
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Toolbar style helpers ────────────────────────────────────────────────────

const smallLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  color: 'var(--text-tertiary)',
};

const smallInputStyle: React.CSSProperties = {
  padding: '0.3rem 0.4rem',
  borderRadius: '0.375rem',
  border: '1px solid var(--border)',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.8rem',
  outline: 'none',
  textAlign: 'center',
};

const toolbarBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.3rem',
  padding: '0.3rem 0.75rem',
  borderRadius: '0.375rem',
  border: '1px solid var(--border)',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  transition: 'border-color 0.15s, background 0.15s',
};
