import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Circle, RectangleHorizontal, Square, Diamond, Save, Trash2, Tags } from 'lucide-react';
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

function ShapeIcon({ shape, size = 16 }: { shape: TableShape; size?: number }): React.ReactElement {
  switch (shape) {
    case 'Round':
      return <Circle size={size} />;
    case 'Rectangle':
      return <RectangleHorizontal size={size} />;
    case 'Cocktail':
      return <Diamond size={size} />;
    case 'Square':
    default:
      return <Square size={size} />;
  }
}

function generateId(): string {
  return `el_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Table Cell ───────────────────────────────────────────────────────────────

interface TableCellProps {
  element: FloorPlanElement;
  isSelected: boolean;
  onSelect: (id: string, evt: React.MouseEvent) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  onDragStart: (id: string) => void;
}

function TableCell({ element, isSelected, onSelect, onContextMenu, onDragStart }: TableCellProps): React.ReactElement {
  const baseColor = element.color ?? 'var(--accent-primary)';

  return (
    <div
      draggable
      onDragStart={() => onDragStart(element.id)}
      onClick={(e) => onSelect(element.id, e)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(element.id, e.clientX, e.clientY);
      }}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        cursor: 'grab',
        padding: '4px',
        boxSizing: 'border-box',
        border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'transparent'}`,
        borderRadius: '4px',
        background: isSelected
          ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)'
          : 'transparent',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {/* Shape icon with element color */}
      <div style={{ color: baseColor }}>
        <ShapeIcon shape={element.shape} size={20} />
      </div>
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
              <ShapeIcon shape={s} size={12} />
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
      <FieldRow label="Color">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="#4f46e5"
            value={localColor}
            onChange={(e) => setLocalColor(e.target.value)}
            onBlur={commitColor}
            onKeyDown={(e) => e.key === 'Enter' && commitColor()}
            style={{ ...inputStyle, flex: 1 }}
          />
          {localColor && (
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: localColor,
                border: '1px solid var(--border)',
                flexShrink: 0,
              }}
            />
          )}
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

  const { selectedIds, select, clearSelection } = useEditorStore();

  const [tableTypes, setTableTypes] = useState<TableType[]>([]);
  const [loadingLayout, setLoadingLayout] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rowsInput, setRowsInput] = useState(10);
  const [colsInput, setColsInput] = useState(10);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [draggingFromPalette, setDraggingFromPalette] = useState<TableType | null>(null);
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

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

  // Load layout
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    async function load(): Promise<void> {
      setLoadingLayout(true);
      try {
        const res = await apiClient.get(`/admin/events/${eventId}/layout`);
        if (!cancelled) {
          loadFromApi(res.data);
          setRowsInput(res.data.gridRows ?? 10);
          setColsInput(res.data.gridCols ?? 10);
        }
      } catch {
        // Layout may not exist yet — set defaults
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

  // Close context menu on outside click
  useEffect(() => {
    function handleClick(): void {
      setContextMenu(null);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Stats
  const allElements = elementOrder.map((id) => elements[id]).filter(Boolean);
  const totalTables = allElements.length;
  const totalSeats = allElements.reduce((acc, el) => acc + el.capacity, 0);
  const sections = new Set(allElements.map((el) => el.section).filter(Boolean)).size;

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
      const el: FloorPlanElement = {
        id: generateId(),
        label: `T${totalTables + 1}`,
        capacity: tt.defaultCapacity,
        shape: tt.defaultShape,
        color: tt.defaultColor,
        section: undefined,
        priceType: 'PerTable',
        priceCents: tt.defaultPriceCents,
        isActive: true,
        gridRow: row,
        gridCol: col,
        width: tt.defaultShape === 'Rectangle' ? 120 : 80,
        height: 80,
        rotation: 0,
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
    select(id);
  }

  function handleDelete(id: string): void {
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
      updateElement(el.id, { label: `T${idx + 1}` });
    });
    toast.success('Tables auto-labeled');
  }, [allElements, updateElement]);

  async function handleSave(): Promise<void> {
    setSaving(true);
    try {
      const tables = elementOrder.map((id, idx) => {
        const el = elements[id];
        return {
          id: el.id,
          label: el.label,
          capacity: el.capacity,
          shape: el.shape,
          color: el.color,
          section: el.section,
          priceType: el.priceType,
          priceCents: el.priceOverrideCents ?? el.priceCents,
          isActive: el.isActive,
          gridRow: el.gridRow,
          gridCol: el.gridCol,
          posX: el.posX,
          posY: el.posY,
          width: el.width,
          height: el.height,
          rotation: el.rotation,
          sortOrder: idx,
          tableTypeId: el.tableTypeId,
        };
      });

      await apiClient.post(`/admin/events/${eventId}/layout`, {
        editorMode: 'grid',
        gridRows: rows,
        gridCols: cols,
        tables,
      });

      markClean();
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
          {tableTypes.map((tt) => (
            <div
              key={tt.id}
              draggable
              onDragStart={() => setDraggingFromPalette(tt)}
              onDragEnd={() => setDraggingFromPalette(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.625rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                background: 'var(--bg-tertiary)',
                cursor: 'grab',
                marginBottom: '0.5rem',
                transition: 'border-color 0.15s',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <div style={{ color: tt.defaultColor || 'var(--accent-primary)', flexShrink: 0 }}>
                <ShapeIcon shape={tt.defaultShape} size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tt.name}
                </div>
              </div>
              <div
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'var(--text-tertiary)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '999px',
                  padding: '1px 6px',
                  flexShrink: 0,
                }}
              >
                ×{tt.defaultCapacity}
              </div>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: tt.defaultColor || 'var(--accent-primary)',
                  flexShrink: 0,
                }}
              />
            </div>
          ))}
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

          {/* Stats */}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{totalTables}</strong> tables,{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{totalSeats}</strong> seats,{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{sections}</strong> sections
          </span>

          <div style={{ flex: 1 }} />

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
            {saving ? 'Saving…' : 'Save Layout'}
          </button>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
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

                  return (
                    <div
                      key={`cell-${r}-${c}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.stopPropagation();
                        handleCellDrop(r, c);
                      }}
                      style={{
                        width: '64px',
                        height: '64px',
                        border: occupant
                          ? `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border)'}`
                          : '1px dashed var(--border)',
                        borderRadius: '4px',
                        background: occupant ? 'var(--bg-secondary)' : 'transparent',
                        position: 'relative',
                        transition: 'border-color 0.1s',
                        boxSizing: 'border-box',
                      }}
                    >
                      {occupant && (
                        <TableCell
                          element={occupant}
                          isSelected={isSelected}
                          onSelect={handleSelectCell}
                          onContextMenu={(id, x, y) => setContextMenu({ x, y, elementId: id })}
                          onDragStart={(id) => setDraggingElementId(id)}
                        />
                      )}
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
