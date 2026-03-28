import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Circle,
  RectangleHorizontal,
  Square,
  Diamond,
  MousePointer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3X3,
  Magnet,
  Undo2,
  Redo2,
  Save,
  Trash2,
} from 'lucide-react';
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

interface VenueObject {
  id: string;
  label: string;
  shape: 'Rectangle';
  color: string;
  width: number;
  height: number;
}

const VENUE_OBJECTS: VenueObject[] = [
  { id: 'stage', label: 'Stage', shape: 'Rectangle', color: '#6366f1', width: 200, height: 80 },
  { id: 'bar', label: 'Bar', shape: 'Rectangle', color: '#f59e0b', width: 160, height: 60 },
  { id: 'dance_floor', label: 'Dance Floor', shape: 'Rectangle', color: '#10b981', width: 200, height: 160 },
];

interface HistoryEntry {
  elements: Record<string, FloorPlanElement>;
  elementOrder: string[];
}

// ─── CSS variable resolution helper ──────────────────────────────────────────

function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// ─── Canvas draw helpers ──────────────────────────────────────────────────────

function drawElement(
  ctx: CanvasRenderingContext2D,
  el: FloorPlanElement,
  isSelected: boolean,
  zoom: number,
  offsetX: number,
  offsetY: number,
  accentColor: string,
  textColor: string,
): void {
  const x = (el.posX ?? 0) * zoom + offsetX;
  const y = (el.posY ?? 0) * zoom + offsetY;
  const w = el.width * zoom;
  const h = el.height * zoom;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const color = el.color ?? accentColor;

  ctx.save();
  ctx.translate(cx, cy);
  if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);

  ctx.beginPath();

  if (el.shape === 'Round') {
    const r = Math.min(w, h) / 2;
    ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
  } else if (el.shape === 'Cocktail') {
    // Diamond
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w, h / 2);
    ctx.lineTo(w / 2, h);
    ctx.lineTo(0, h / 2);
    ctx.closePath();
  } else {
    // Rectangle or Square — rounded rect
    const r = 6 * zoom;
    ctx.roundRect(0, 0, w, h, r);
  }

  ctx.fillStyle = `${color}22`;
  ctx.fill();

  ctx.strokeStyle = isSelected ? accentColor : color;
  ctx.lineWidth = isSelected ? 2.5 : 1.5;
  ctx.stroke();

  if (isSelected) {
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.stroke();
  }

  ctx.setLineDash([]);

  // Label
  const fontSize = Math.max(9, Math.min(13, 11 * zoom));
  ctx.font = `600 ${fontSize}px DM Sans, system-ui, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(el.label, w / 2, h / 2 - fontSize * 0.5);

  const capFontSize = Math.max(7, Math.min(10, 9 * zoom));
  ctx.font = `400 ${capFontSize}px DM Sans, system-ui, sans-serif`;
  ctx.fillStyle = `${textColor}88`;
  ctx.fillText(`${el.capacity}p`, w / 2, h / 2 + fontSize * 0.6);

  ctx.restore();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
  gridColor: string,
): void {
  const step = 40 * zoom;
  const startX = ((offsetX % step) + step) % step;
  const startY = ((offsetY % step) + step) % step;

  ctx.fillStyle = gridColor;
  for (let x = startX; x < width; x += step) {
    for (let y = startY; y < height; y += step) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ─── Snap helper ─────────────────────────────────────────────────────────────

function snapValue(v: number, snapSize: number): number {
  return Math.round(v / snapSize) * snapSize;
}

// ─── Shape Icon ───────────────────────────────────────────────────────────────

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

  useEffect(() => {
    queueMicrotask(() => {
      setLocalLabel(element.label);
      setLocalSection(element.section ?? '');
      setLocalColor(element.color ?? '');
    });
  }, [element.id, element.label, element.section, element.color]);

  function commitLabel(): void { onUpdate(element.id, { label: localLabel }); }
  function commitSection(): void { onUpdate(element.id, { section: localSection || undefined }); }
  function commitColor(): void { onUpdate(element.id, { color: localColor || undefined }); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
        Table Properties
      </h3>

      <FieldRow label="Label">
        <input type="text" value={localLabel} onChange={(e) => setLocalLabel(e.target.value)}
          onBlur={commitLabel} onKeyDown={(e) => e.key === 'Enter' && commitLabel()} style={inputStyle} />
      </FieldRow>

      <FieldRow label="Capacity">
        <input type="number" min={1} max={999} value={element.capacity}
          onChange={(e) => onUpdate(element.id, { capacity: Math.max(1, Number(e.target.value)) })} style={inputStyle} />
      </FieldRow>

      <FieldRow label="Shape">
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {(['Round', 'Rectangle', 'Square'] as TableShape[]).map((s) => (
            <button key={s} type="button" onClick={() => onUpdate(element.id, { shape: s })}
              style={{
                padding: '0.3rem 0.5rem', borderRadius: '0.375rem',
                border: `1px solid ${element.shape === s ? 'var(--accent-primary)' : 'var(--border)'}`,
                background: element.shape === s ? 'color-mix(in srgb, var(--accent-primary) 12%, var(--bg-secondary))' : 'var(--bg-tertiary)',
                color: element.shape === s ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'var(--font-body)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.25rem',
              }}
            >
              <ShapeIcon shape={s} size={12} />{s}
            </button>
          ))}
        </div>
      </FieldRow>

      <FieldRow label="Section">
        <input type="text" placeholder="e.g. VIP" value={localSection} onChange={(e) => setLocalSection(e.target.value)}
          onBlur={commitSection} onKeyDown={(e) => e.key === 'Enter' && commitSection()} style={inputStyle} />
      </FieldRow>

      <FieldRow label="Color">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="text" placeholder="#4f46e5" value={localColor} onChange={(e) => setLocalColor(e.target.value)}
            onBlur={commitColor} onKeyDown={(e) => e.key === 'Enter' && commitColor()} style={{ ...inputStyle, flex: 1 }} />
          {localColor && <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: localColor, border: '1px solid var(--border)', flexShrink: 0 }} />}
        </div>
      </FieldRow>

      <FieldRow label="Price Type">
        <div style={{ display: 'flex', gap: '1rem' }}>
          {(['PerTable', 'PerSeat'] as const).map((pt) => (
            <label key={pt} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
              <input type="radio" name={`priceType_${element.id}`} checked={element.priceType === pt}
                onChange={() => onUpdate(element.id, { priceType: pt })} style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }} />
              {pt === 'PerTable' ? 'Per Table' : 'Per Seat'}
            </label>
          ))}
        </div>
      </FieldRow>

      <FieldRow label="Price ($)">
        <input type="number" min={0} step={0.01} value={(element.priceOverrideCents ?? element.priceCents) / 100}
          onChange={(e) => onUpdate(element.id, { priceOverrideCents: Math.round(Number(e.target.value) * 100) })} style={inputStyle} />
      </FieldRow>

      {/* Position/size/rotation */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
          Transform
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <FieldRow label="X">
            <input type="number" value={Math.round(element.posX ?? 0)}
              onChange={(e) => onUpdate(element.id, { posX: Number(e.target.value) })} style={inputStyle} />
          </FieldRow>
          <FieldRow label="Y">
            <input type="number" value={Math.round(element.posY ?? 0)}
              onChange={(e) => onUpdate(element.id, { posY: Number(e.target.value) })} style={inputStyle} />
          </FieldRow>
          <FieldRow label="W">
            <input type="number" min={20} value={Math.round(element.width)}
              onChange={(e) => onUpdate(element.id, { width: Math.max(20, Number(e.target.value)) })} style={inputStyle} />
          </FieldRow>
          <FieldRow label="H">
            <input type="number" min={20} value={Math.round(element.height)}
              onChange={(e) => onUpdate(element.id, { height: Math.max(20, Number(e.target.value)) })} style={inputStyle} />
          </FieldRow>
          <FieldRow label="Rotation°">
            <input type="number" min={-360} max={360} value={element.rotation}
              onChange={(e) => onUpdate(element.id, { rotation: Number(e.target.value) })} style={inputStyle} />
          </FieldRow>
        </div>
      </div>

      <FieldRow label="Status">
        <button type="button" onClick={() => onUpdate(element.id, { isActive: !element.isActive })}
          style={{
            padding: '0.3rem 0.875rem', borderRadius: '999px', border: 'none',
            background: element.isActive ? 'var(--color-success)' : 'var(--bg-tertiary)',
            color: element.isActive ? 'var(--bg-primary)' : 'var(--text-tertiary)',
            cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'var(--font-body)', fontWeight: 600,
          }}
        >
          {element.isActive ? 'Available' : 'Inactive'}
        </button>
      </FieldRow>

      {element.tableTypeName && (
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Type: {element.tableTypeName}</p>
      )}

      <button type="button" onClick={() => onDelete(element.id)}
        style={{
          marginTop: '0.25rem', padding: '0.5rem 1rem', borderRadius: '0.5rem',
          border: '1px solid var(--color-error)', background: 'transparent', color: 'var(--color-error)',
          cursor: 'pointer', fontSize: '0.8125rem', fontFamily: 'var(--font-body)', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '0.375rem',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--color-error) 10%, transparent)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <Trash2 size={14} />Delete Table
      </button>
    </div>
  );
}

// ─── Field Row ────────────────────────────────────────────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.4rem 0.625rem', borderRadius: '0.375rem',
  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
  color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
  outline: 'none', boxSizing: 'border-box',
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface CanvasEditorProps {
  eventId: string;
}

export default function CanvasEditor({ eventId }: CanvasEditorProps): React.ReactElement {
  const {
    elements,
    elementOrder,
    isDirty,
    addElement,
    updateElement,
    deleteElement,
    loadFromApi,
    markClean,
  } = useFloorPlanStore();

  const { selectedIds, select, clearSelection, showGrid, snapToGrid, toggleGrid, toggleSnap } = useEditorStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tableTypes, setTableTypes] = useState<TableType[]>([]);
  const [loadingLayout, setLoadingLayout] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 40, y: 40 });
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });
  const [elementOrigin, setElementOrigin] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggingPaletteType, setDraggingPaletteType] = useState<TableType | null>(null);

  // Undo/redo history
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Autosave debounce
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Event Overrides (FIX 6)
  const [overridesEnabled, setOverridesEnabled] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, { priceCents: number; capacity: number }>>({});

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
        if (!cancelled) loadFromApi(res.data);
      } catch {
        // No layout yet — that's fine
      } finally {
        if (!cancelled) setLoadingLayout(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Auto-save when dirty
  useEffect(() => {
    if (!isDirty) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void performSave(true);
    }, 2_000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, elements, elementOrder]);

  // Push to history when elements change
  const pushHistory = useCallback(() => {
    const entry: HistoryEntry = {
      elements: JSON.parse(JSON.stringify(elements)) as Record<string, FloorPlanElement>,
      elementOrder: [...elementOrder],
    };
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, entry].slice(-50); // keep last 50
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [elements, elementOrder, historyIndex]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background
    const bgColor = getCssVar('--bg-primary');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    // Grid dots
    if (showGrid) {
      const gridColor = getCssVar('--border');
      drawGrid(ctx, w, h, zoom, offset.x, offset.y, gridColor || 'rgba(0,0,0,0.1)');
    }

    // Elements
    const accentColor = getCssVar('--accent-primary') || '#4f46e5';
    const textColor = getCssVar('--text-primary') || '#1c1917';

    for (const id of elementOrder) {
      const el = elements[id];
      if (!el) continue;
      drawElement(ctx, el, selectedIds.includes(id), zoom, offset.x, offset.y, accentColor, textColor);
    }
  }, [elements, elementOrder, selectedIds, zoom, offset, showGrid]);

  // Resize canvas to container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    });
    observer.observe(container);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    return () => observer.disconnect();
  }, []);

  // Hit test: find element at canvas coords
  function hitTest(cx: number, cy: number): string | null {
    for (let i = elementOrder.length - 1; i >= 0; i--) {
      const id = elementOrder[i];
      const el = elements[id];
      if (!el) continue;
      const x = (el.posX ?? 0) * zoom + offset.x;
      const y = (el.posY ?? 0) * zoom + offset.y;
      const w = el.width * zoom;
      const h = el.height * zoom;
      if (cx >= x && cx <= x + w && cy >= y && cy <= y + h) return id;
    }
    return null;
  }

  function canvasToWorld(cx: number, cy: number): { x: number; y: number } {
    return {
      x: (cx - offset.x) / zoom,
      y: (cy - offset.y) / zoom,
    };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>): void {
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const hitId = hitTest(cx, cy);
    if (hitId) {
      if (e.shiftKey) {
        // multi-select not needed for canvas single-element drag
      } else {
        select(hitId);
      }
      const el = elements[hitId];
      setDraggingElementId(hitId);
      setDragOrigin({ x: e.clientX, y: e.clientY });
      setElementOrigin({ x: el.posX ?? 0, y: el.posY ?? 0 });
      setIsDragging(false);
    } else {
      clearSelection();
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>): void {
    if (!draggingElementId) return;

    const dx = (e.clientX - dragOrigin.x) / zoom;
    const dy = (e.clientY - dragOrigin.y) / zoom;

    if (!isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      setIsDragging(true);
    }

    let newX = elementOrigin.x + dx;
    let newY = elementOrigin.y + dy;

    if (snapToGrid) {
      newX = snapValue(newX, 20);
      newY = snapValue(newY, 20);
    }

    newX = Math.max(0, newX);
    newY = Math.max(0, newY);

    updateElement(draggingElementId, { posX: newX, posY: newY });
  }

  function handleMouseUp(): void {
    if (isDragging && draggingElementId) {
      pushHistory();
    }
    setDraggingElementId(null);
    setIsDragging(false);
  }

  function handleWheel(e: React.WheelEvent<HTMLCanvasElement>): void {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(4, Math.max(0.2, zoom * factor));

    // Zoom toward cursor
    const newOffX = mx - (mx - offset.x) * (newZoom / zoom);
    const newOffY = my - (my - offset.y) * (newZoom / zoom);

    setZoom(newZoom);
    setOffset({ x: newOffX, y: newOffY });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      for (const id of selectedIds) {
        deleteElement(id);
      }
      clearSelection();
      pushHistory();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      handleUndo();
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      handleRedo();
    }
  }

  function handleUndo(): void {
    if (historyIndex <= 0) return;
    const entry = history[historyIndex - 1];
    if (!entry) return;
    useFloorPlanStore.setState({
      elements: entry.elements,
      elementOrder: entry.elementOrder,
      isDirty: true,
    });
    setHistoryIndex((prev) => prev - 1);
  }

  function handleRedo(): void {
    if (historyIndex >= history.length - 1) return;
    const entry = history[historyIndex + 1];
    if (!entry) return;
    useFloorPlanStore.setState({
      elements: entry.elements,
      elementOrder: entry.elementOrder,
      isDirty: true,
    });
    setHistoryIndex((prev) => prev + 1);
  }

  function handleZoomToFit(): void {
    const canvas = canvasRef.current;
    if (!canvas || elementOrder.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const id of elementOrder) {
      const el = elements[id];
      if (!el) continue;
      const x = el.posX ?? 0;
      const y = el.posY ?? 0;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + el.width);
      maxY = Math.max(maxY, y + el.height);
    }

    const pad = 60;
    const fw = canvas.width - pad * 2;
    const fh = canvas.height - pad * 2;
    const contentW = maxX - minX;
    const contentH = maxY - minY;

    if (contentW <= 0 || contentH <= 0) return;

    const newZoom = Math.min(4, Math.max(0.2, Math.min(fw / contentW, fh / contentH)));
    const newOffX = pad - minX * newZoom;
    const newOffY = pad - minY * newZoom;

    setZoom(newZoom);
    setOffset({ x: newOffX, y: newOffY });
  }

  // Palette drag onto canvas
  function handleCanvasDrop(e: React.DragEvent<HTMLCanvasElement>): void {
    e.preventDefault();
    if (!draggingPaletteType) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const world = canvasToWorld(cx, cy);

    let x = world.x - draggingPaletteType.defaultShape === 'Rectangle' ? 60 : 40;
    let y = world.y - 40;

    if (snapToGrid) {
      x = snapValue(world.x - 40, 20);
      y = snapValue(world.y - 40, 20);
    }

    const totalTables = elementOrder.length;
    const tt = draggingPaletteType;
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
      posX: Math.max(0, x),
      posY: Math.max(0, y),
      width: tt.defaultShape === 'Rectangle' ? 120 : 80,
      height: 80,
      rotation: 0,
      sortOrder: totalTables,
      tableTypeId: tt.id,
      tableTypeName: tt.name,
    };
    addElement(el);
    setDraggingPaletteType(null);
    pushHistory();
  }

  function handleVenueObjectDrop(obj: VenueObject, e: React.DragEvent<HTMLCanvasElement>): void {
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const world = canvasToWorld(cx, cy);

    const el: FloorPlanElement = {
      id: generateId(),
      label: obj.label,
      capacity: 0,
      shape: 'Rectangle',
      color: obj.color,
      section: undefined,
      priceType: 'PerTable',
      priceCents: 0,
      isActive: true,
      posX: Math.max(0, world.x - obj.width / 2),
      posY: Math.max(0, world.y - obj.height / 2),
      width: obj.width,
      height: obj.height,
      rotation: 0,
      sortOrder: elementOrder.length,
    };
    addElement(el);
    pushHistory();
  }

  async function performSave(silent = false): Promise<void> {
    try {
      const tables = elementOrder.map((id, idx) => {
        const el = elements[id];
        return {
          id: el.id, label: el.label, capacity: el.capacity, shape: el.shape,
          color: el.color, section: el.section, priceType: el.priceType,
          priceCents: el.priceOverrideCents ?? el.priceCents,
          isActive: el.isActive, posX: el.posX, posY: el.posY,
          width: el.width, height: el.height, rotation: el.rotation,
          sortOrder: idx, tableTypeId: el.tableTypeId,
        };
      });

      await apiClient.post(`/admin/events/${eventId}/layout`, {
        editorMode: 'canvas', gridRows: 0, gridCols: 0, tables,
      });

      markClean();
      if (!silent) toast.success('Layout saved');
    } catch {
      if (!silent) toast.error('Failed to save layout');
    }
  }

  async function handleSave(): Promise<void> {
    setSaving(true);
    try {
      await performSave(false);
    } finally {
      setSaving(false);
    }
  }

  const allElements = elementOrder.map((id) => elements[id]).filter(Boolean);
  const totalTables = allElements.length;
  const selectedElement = selectedIds[0] ? elements[selectedIds[0]] : null;

  if (loadingLayout) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Loading layout…</span>
      </div>
    );
  }

  return (
    <div
      style={{ display: 'flex', height: '100%', minHeight: '640px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden', position: 'relative' }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* ── Left Panel ──────────────────────────────────────────────── */}
      <div style={{ width: '220px', flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Table Types
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {tableTypes.map((tt) => (
            <div
              key={tt.id}
              draggable
              onDragStart={() => setDraggingPaletteType(tt)}
              onDragEnd={() => setDraggingPaletteType(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.625rem 0.75rem', borderRadius: '0.5rem',
                border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                cursor: 'grab', marginBottom: '0.5rem', userSelect: 'none',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div style={{ color: tt.defaultColor || 'var(--accent-primary)', flexShrink: 0 }}>
                <ShapeIcon shape={tt.defaultShape} size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tt.name}
                </div>
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '999px', padding: '1px 5px', flexShrink: 0 }}>
                ×{tt.defaultCapacity}
              </div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: tt.defaultColor || 'var(--accent-primary)', flexShrink: 0 }} />
            </div>
          ))}

          {/* Venue Objects */}
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
              Venue Objects
            </div>
            {VENUE_OBJECTS.map((obj) => (
              <div
                key={obj.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('venueObjectId', obj.id);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                  border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                  cursor: 'grab', marginBottom: '0.4rem', userSelect: 'none',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = obj.color; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <div style={{ width: '12px', height: '8px', background: obj.color, borderRadius: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{obj.label}</span>
              </div>
            ))}
          </div>

          {/* ── Event Overrides (FIX 6) ── */}
          {tableTypes.length > 0 && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  marginBottom: overridesEnabled ? '0.75rem' : 0,
                }}
              >
                <input
                  type="checkbox"
                  checked={overridesEnabled}
                  onChange={(e) => setOverridesEnabled(e.target.checked)}
                  style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Customize for this event
                </span>
              </label>

              {overridesEnabled && tableTypes.map((tt) => (
                <div
                  key={tt.id}
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    padding: '0.625rem 0.75rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <div style={{ color: tt.defaultColor || 'var(--accent-primary)' }}>
                      <ShapeIcon shape={tt.defaultShape} size={12} />
                    </div>
                    {tt.name}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.2rem', textTransform: 'uppercase' as const }}>Price ($)</div>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder={String(tt.defaultPriceCents / 100)}
                        value={overrides[tt.id]?.priceCents !== undefined ? overrides[tt.id].priceCents / 100 : ''}
                        onChange={(e) => {
                          const cents = Math.round(Number(e.target.value) * 100);
                          setOverrides((prev) => ({
                            ...prev,
                            [tt.id]: { capacity: prev[tt.id]?.capacity ?? tt.defaultCapacity, priceCents: cents },
                          }));
                        }}
                        style={{ width: '100%', padding: '0.3rem 0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' as const }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.2rem', textTransform: 'uppercase' as const }}>Cap</div>
                      <input
                        type="number"
                        min={1}
                        placeholder={String(tt.defaultCapacity)}
                        value={overrides[tt.id]?.capacity !== undefined ? overrides[tt.id].capacity : ''}
                        onChange={(e) => {
                          const cap = Math.max(1, Number(e.target.value));
                          setOverrides((prev) => ({
                            ...prev,
                            [tt.id]: { priceCents: prev[tt.id]?.priceCents ?? tt.defaultPriceCents, capacity: cap },
                          }));
                        }}
                        style={{ width: '100%', padding: '0.3rem 0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' as const }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Center: Canvas ───────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', minWidth: 0, minHeight: '500px' }}>
        {/* Floating toolbar */}
        <div
          style={{
            position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '0.625rem', padding: '6px 10px',
            boxShadow: 'var(--shadow-card-hover)',
          }}
        >
          <button type="button" title="Select" style={tbBtn(true)}>
            <MousePointer size={14} />
          </button>
          <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 2px' }} />
          <button type="button" title="Zoom In" onClick={() => setZoom((z) => Math.min(4, z * 1.2))} style={tbBtn()}>
            <ZoomIn size={14} />
          </button>
          <button type="button" title="Zoom Out" onClick={() => setZoom((z) => Math.max(0.2, z / 1.2))} style={tbBtn()}>
            <ZoomOut size={14} />
          </button>
          <button type="button" title="Zoom to Fit" onClick={handleZoomToFit} style={tbBtn()}>
            <Maximize2 size={14} />
          </button>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', minWidth: '36px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 2px' }} />
          <button type="button" title="Toggle Grid" onClick={toggleGrid} style={tbBtn(showGrid)}>
            <Grid3X3 size={14} />
          </button>
          <button type="button" title="Snap to Grid" onClick={toggleSnap} style={tbBtn(snapToGrid)}>
            <Magnet size={14} />
          </button>
          <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 2px' }} />
          <button type="button" title="Undo (Ctrl+Z)" onClick={handleUndo} disabled={historyIndex <= 0} style={tbBtn(false, historyIndex <= 0)}>
            <Undo2 size={14} />
          </button>
          <button type="button" title="Redo (Ctrl+Y)" onClick={handleRedo} disabled={historyIndex >= history.length - 1} style={tbBtn(false, historyIndex >= history.length - 1)}>
            <Redo2 size={14} />
          </button>
          <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 2px' }} />
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            style={{
              ...tbBtn(isDirty),
              paddingLeft: '10px', paddingRight: '10px',
              background: isDirty ? 'var(--accent-primary)' : undefined,
              color: isDirty ? 'var(--bg-primary)' : undefined,
              borderColor: isDirty ? 'var(--accent-primary)' : undefined,
              gap: '4px', display: 'flex', alignItems: 'center',
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Save size={13} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* Stats bar */}
        <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '999px', padding: '4px 14px', fontSize: '0.75rem', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-card)' }}>
          {totalTables} tables · {allElements.reduce((a, e) => a + e.capacity, 0)} seats
        </div>

        {/* Canvas */}
        <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', width: '100%', height: '100%', minHeight: '500px' }}>
          <canvas
            ref={canvasRef}
            style={{ display: 'block', cursor: isDragging ? 'grabbing' : draggingElementId ? 'grab' : 'default' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const venueObjId = e.dataTransfer.getData('venueObjectId');
              if (venueObjId) {
                const obj = VENUE_OBJECTS.find((o) => o.id === venueObjId);
                if (obj) handleVenueObjectDrop(obj, e);
              } else {
                handleCanvasDrop(e);
              }
            }}
          />
        </div>
      </div>

      {/* ── Right Panel ──────────────────────────────────────────────── */}
      <div style={{ width: '280px', flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Properties
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {selectedElement ? (
            <PropertiesPanel
              element={selectedElement}
              onUpdate={updateElement}
              onDelete={(id) => { deleteElement(id); clearSelection(); pushHistory(); }}
            />
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem 0', margin: 0 }}>
              Select a table to edit properties
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Toolbar button style helper ──────────────────────────────────────────────

function tbBtn(active = false, disabled = false): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '28px', height: '28px', borderRadius: '0.375rem',
    border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border)'}`,
    background: active ? 'color-mix(in srgb, var(--accent-primary) 12%, var(--bg-secondary))' : 'transparent',
    color: active ? 'var(--accent-primary)' : disabled ? 'var(--text-tertiary)' : 'var(--text-secondary)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    padding: 0,
    transition: 'border-color 0.15s, background 0.15s',
  };
}
