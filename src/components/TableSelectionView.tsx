import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Clock, Lock, Check, Users, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { eventsApi, seatsApi } from '../services/eventsApi';
import { useAuthStore } from '../stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventTable {
  id: string;
  label: string;
  capacity: number;
  shape: string;
  color: string | null;
  section: string | null;
  priceType: string;
  priceCents: number;
  platformFeeCents: number;
  gridRow: number | null;
  gridCol: number | null;
  sortOrder: number;
  status: 'Available' | 'Held' | 'HeldByYou' | 'Booked';
  holdExpiresAt: string | null;
}

interface TablesResponse {
  eventId: string;
  gridRows: number;
  gridCols: number;
  tables: EventTable[];
}

interface Props {
  eventId: string;
  ticketTypeId: string;
  onTableSelected: (table: EventTable | null) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function colLetter(idx: number): string {
  return String.fromCharCode(65 + idx);
}

function formatCents(cents: number): string {
  if (cents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function Countdown({ expiresAt }: { expiresAt: string }): React.ReactElement {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    function tick(): void {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setRemaining(`${m}:${s.toString().padStart(2, '0')}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return (
    <span aria-live="off" aria-label={`Hold expires in ${remaining}`} style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
      {remaining}
    </span>
  );
}

// ─── Skeleton loading state ───────────────────────────────────────────────────

function GridSkeleton({ rows, cols }: { rows: number; cols: number }): React.ReactElement {
  return (
    <div>
      <style>{`@keyframes shimmer { 0%{opacity:1}50%{opacity:0.4}100%{opacity:1} }`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--bg-tertiary)', animation: 'shimmer 1.4s ease-in-out infinite', flexShrink: 0 }} />
            {Array.from({ length: cols }, (_, c) => (
              <div key={c} style={{
                flex: 1, height: 64, borderRadius: 8,
                background: 'var(--bg-tertiary)',
                animation: `shimmer 1.4s ease-in-out ${(r * cols + c) * 0.06}s infinite`,
              }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TableSelectionView({ eventId, ticketTypeId, onTableSelected }: Props): React.ReactElement {
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<TablesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [holdingId, setHoldingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [availHeight, setAvailHeight] = useState(0);
  const onTableSelectedRef = useRef(onTableSelected);
  onTableSelectedRef.current = onTableSelected;

  // Dynamic cell sizing — track both container width and available viewport height
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = (): void => {
      setContainerWidth(el.clientWidth);
      // Target: the whole component fits within 82% of the viewport height.
      // OVERHEAD accounts for space taken by the stage banner, column-header row,
      // legend, front/back indicator, and internal gaps (~276 px total).
      const OVERHEAD = 276;
      setAvailHeight(Math.max(180, window.innerHeight * 0.82 - OVERHEAD));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const loadTables = useCallback(async () => {
    try {
      const res = await eventsApi.getTables<TablesResponse>(eventId);
      setData(res.data);
    } catch {
      toast.error('Failed to load seating layout');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void loadTables(); }, [loadTables]);

  // Poll every 15s to refresh seat statuses
  useEffect(() => {
    const id = setInterval(() => { void loadTables(); }, 15000);
    return () => clearInterval(id);
  }, [loadTables]);

  // Notify parent when a table is held
  useEffect(() => {
    if (!data) return;
    const held = data.tables.find(t => t.status === 'HeldByYou');
    onTableSelectedRef.current(held ?? null);
  }, [data]);

  async function handleTableClick(table: EventTable): Promise<void> {
    if (!isAuthenticated) {
      toast.error('Please sign in to select a table');
      return;
    }
    if (table.status === 'Held' || table.status === 'Booked') return;

    if (table.status === 'HeldByYou') {
      setHoldingId(table.id);
      try {
        await seatsApi.release(eventId, table.id);
        await loadTables();
      } catch {
        toast.error('Failed to release table');
      } finally {
        setHoldingId(null);
      }
      return;
    }

    // Release any existing hold first
    const currentHold = data?.tables.find(t => t.status === 'HeldByYou');
    if (currentHold) {
      try { await seatsApi.release(eventId, currentHold.id); } catch { /* ignore */ }
    }

    setHoldingId(table.id);
    try {
      await seatsApi.hold(eventId, table.id, ticketTypeId);
      await loadTables();
      toast.success(`Table ${table.label} reserved — complete your booking!`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to hold table';
      toast.error(msg);
      await loadTables();
    } finally {
      setHoldingId(null);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  // containerRef must always be in the DOM so the ResizeObserver measures correctly.
  if (loading) {
    return (
      <div ref={containerRef} role="status" aria-busy="true" aria-label="Loading seating layout">
        <GridSkeleton rows={3} cols={5} />
      </div>
    );
  }

  if (!data || data.tables.length === 0) {
    return (
      <div ref={containerRef} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
        No seating layout available.
      </div>
    );
  }

  // ── Data ──────────────────────────────────────────────────────────────────
  const { gridCols, tables } = data;

  // Occupancy map: "row-col" → table
  const occupancy = new Map<string, EventTable>();
  for (const t of tables) {
    if (t.gridRow !== null && t.gridCol !== null) {
      occupancy.set(`${t.gridRow}-${t.gridCol}`, t);
    }
  }

  // Only render rows that have at least one table (trims trailing empty rows the API may return)
  const effectiveRows = tables.reduce(
    (max, t) => (t.gridRow !== null ? Math.max(max, t.gridRow + 1) : max), 0
  );

  // Dynamic cell size — fill width AND fit all rows in the visible viewport.
  // cellSize is the smaller of the two constraints so nothing needs scrolling.
  const LABEL_W = 32;
  const LABEL_H = 30; // column-header row height
  const GAP = 8;

  const cellFromWidth = containerWidth > 0
    ? Math.floor((containerWidth - LABEL_W - GAP * gridCols) / gridCols)
    : 72;

  const cellFromHeight = availHeight > 0
    ? Math.floor((availHeight - LABEL_H - GAP * effectiveRows) / effectiveRows)
    : 999;

  const cellSize = Math.max(42, Math.min(cellFromWidth, cellFromHeight));

  // Held table for info bar
  const myTable = tables.find(t => t.status === 'HeldByYou') ?? null;

  // Initialize focus on first available table
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!focusedCell && data && data.tables.length > 0) {
      const first = data.tables.find(t => t.gridRow !== null && t.gridCol !== null);
      if (first && first.gridRow !== null && first.gridCol !== null) {
        setFocusedCell({ row: first.gridRow, col: first.gridCol });
      }
    }
  }, [data, focusedCell]);

  function handleGridKeyDown(e: React.KeyboardEvent): void {
    if (!focusedCell || !data) return;
    const { row, col } = focusedCell;
    let nextRow = row;
    let nextCol = col;

    switch (e.key) {
      case 'ArrowUp': nextRow = Math.max(0, row - 1); break;
      case 'ArrowDown': nextRow = Math.min(effectiveRows - 1, row + 1); break;
      case 'ArrowLeft': nextCol = Math.max(0, col - 1); break;
      case 'ArrowRight': nextCol = Math.min(gridCols - 1, col + 1); break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const table = occupancy.get(`${row}-${col}`);
        if (table) void handleTableClick(table);
        return;
      }
      default: return;
    }
    e.preventDefault();
    setFocusedCell({ row: nextRow, col: nextCol });

    // Move DOM focus to the cell
    const cellEl = gridRef.current?.querySelector<HTMLElement>(`[data-row="${nextRow}"][data-col="${nextCol}"]`);
    cellEl?.focus();
  }

  // Unique price tiers for legend
  const tiers = Array.from(
    new Map(tables.map(t => [t.priceCents, { price: t.priceCents, color: t.color ?? 'var(--accent-primary)', type: t.priceType }])).values()
  ).sort((a, b) => b.price - a.price);

  // ── Status styles ──────────────────────────────────────────────────────────
  function cellStyle(t: EventTable): {
    bg: string; border: string; cursor: 'pointer' | 'not-allowed' | 'wait'; opacity: number; glow: string;
  } {
    const c = t.color ?? 'var(--accent-primary)';
    const isHolding = holdingId === t.id;
    switch (t.status) {
      case 'Available':
        return {
          bg: `color-mix(in srgb, ${c} 12%, var(--bg-secondary))`,
          border: `2px solid ${c}`,
          cursor: isHolding ? 'wait' : 'pointer',
          opacity: isHolding ? 0.7 : 1,
          glow: `0 6px 20px color-mix(in srgb, ${c} 35%, transparent)`,
        };
      case 'HeldByYou':
        return {
          bg: 'color-mix(in srgb, var(--color-success) 15%, var(--bg-secondary))',
          border: '2px solid var(--color-success)',
          cursor: 'pointer',
          opacity: 1,
          glow: '0 0 0 3px color-mix(in srgb, var(--color-success) 30%, transparent), 0 6px 20px color-mix(in srgb, var(--color-success) 30%, transparent)',
        };
      case 'Held':
        return {
          bg: 'color-mix(in srgb, var(--color-warning) 10%, var(--bg-secondary))',
          border: '2px dashed var(--color-warning)',
          cursor: 'not-allowed',
          opacity: 0.65,
          glow: 'none',
        };
      case 'Booked':
        return {
          bg: 'var(--bg-tertiary)',
          border: '2px solid var(--border)',
          cursor: 'not-allowed',
          opacity: 0.45,
          glow: 'none',
        };
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      {/* ── STAGE banner ──────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', position: 'relative' }}>
        {/* Glow halo behind the stage */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60%', height: '200%',
          background: 'radial-gradient(ellipse at top, color-mix(in srgb, var(--accent-primary) 10%, transparent), transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Stage trapezoid */}
        <div style={{
          position: 'relative',
          display: 'inline-block',
          padding: '0.5rem 2.5rem',
          background: 'linear-gradient(to bottom, var(--bg-tertiary) 0%, color-mix(in srgb, var(--accent-primary) 8%, var(--bg-secondary)) 100%)',
          borderTop: '2px solid var(--accent-primary)',
          borderLeft: '1px solid var(--border)',
          borderRight: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          borderRadius: '0 0 0.75rem 0.75rem',
          minWidth: '55%',
          maxWidth: '85%',
          boxShadow: '0 4px 24px color-mix(in srgb, var(--accent-primary) 15%, transparent)',
        }}>
          <div style={{
            fontSize: '0.6875rem',
            fontWeight: 800,
            letterSpacing: '0.3em',
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
          }}>
            ★ &nbsp;Stage&nbsp; ★
          </div>
        </div>

        {/* Fan-out shadow below stage */}
        <div style={{
          height: '20px',
          background: 'linear-gradient(to bottom, color-mix(in srgb, var(--accent-primary) 8%, transparent), transparent)',
          marginTop: '0',
        }} />
      </div>

      {/* ── Seat grid ─────────────────────────────────────────────────────── */}
      <div
        ref={gridRef}
        role="grid"
        aria-label="Seating layout — use arrow keys to navigate, Enter or Space to select"
        onKeyDown={handleGridKeyDown}
        style={{ overflowX: 'hidden', overflowY: 'visible', paddingBottom: '0.5rem' }}>
        <div style={{ minWidth: 'fit-content' }}>

          {/* Column header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `${LABEL_W}px repeat(${gridCols}, ${cellSize}px)`,
            gap: `${GAP}px`,
            marginBottom: `${GAP}px`,
            paddingLeft: '0',
          }}>
            <div /> {/* corner spacer */}
            {Array.from({ length: gridCols }, (_, c) => (
              <div key={c} style={{
                textAlign: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                letterSpacing: '0.06em',
                paddingBottom: '2px',
                borderBottom: '1px solid var(--border)',
              }}>
                {colLetter(c)}
              </div>
            ))}
          </div>

          {/* Seat rows */}
          {Array.from({ length: effectiveRows }, (_, r) => (
            <div key={r} role="row" style={{
              display: 'grid',
              gridTemplateColumns: `${LABEL_W}px repeat(${gridCols}, ${cellSize}px)`,
              gap: `${GAP}px`,
              marginBottom: `${GAP}px`,
            }}>
              {/* Row number label */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                letterSpacing: '0.05em',
              }}>
                {r + 1}
              </div>

              {/* Seats in this row */}
              {Array.from({ length: gridCols }, (_, c) => {
                const table = occupancy.get(`${r}-${c}`);

                if (!table) {
                  return (
                    <div
                      key={`empty-${r}-${c}`}
                      role="gridcell"
                      data-row={r}
                      data-col={c}
                      style={{ width: cellSize, height: cellSize }}
                    />
                  );
                }

                const s = cellStyle(table);
                const isHovered = hoveredId === table.id;
                const isHolding = holdingId === table.id;
                const isInteractive = s.cursor === 'pointer' || s.cursor === 'wait';
                const smallCell = cellSize < 68;

                return (
                  <div
                    key={table.id}
                    role="gridcell"
                    data-row={r}
                    data-col={c}
                    tabIndex={focusedCell?.row === r && focusedCell?.col === c ? 0 : -1}
                    aria-label={`Table ${table.label}, ${table.capacity} seats, ${formatCents(table.priceCents)}, ${table.status === 'Available' ? 'available' : table.status === 'HeldByYou' ? 'selected by you' : table.status === 'Held' ? 'held by another user' : 'booked'}`}
                    aria-selected={table.status === 'HeldByYou'}
                    aria-disabled={table.status === 'Held' || table.status === 'Booked'}
                    onClick={() => void handleTableClick(table)}
                    onFocus={() => { setFocusedCell({ row: r, col: c }); setHoveredId(table.id); }}
                    onBlur={() => setHoveredId(null)}
                    onMouseEnter={() => setHoveredId(table.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        void handleTableClick(table);
                      }
                    }}
                    title={`${table.label} · ${table.capacity} seats · ${formatCents(table.priceCents)}/${table.priceType === 'PerSeat' ? 'seat' : 'table'}`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: table.shape === 'Round' || table.shape === 'Cocktail'
                        ? '50%'
                        : table.shape === 'Rectangle'
                          ? '0.375rem'
                          : '0.625rem',
                      background: s.bg,
                      border: s.border,
                      cursor: s.cursor,
                      opacity: s.opacity,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      transform: isHovered && isInteractive ? 'scale(1.1)' : 'scale(1)',
                      boxShadow: isHovered && isInteractive ? s.glow
                        : table.status === 'HeldByYou' ? s.glow
                        : 'none',
                      position: 'relative',
                      userSelect: 'none',
                    }}
                  >
                    {/* Status badge — top-right corner */}
                    {table.status === 'Booked' && (
                      <Lock size={9} aria-hidden="true" style={{
                        position: 'absolute', top: 4, right: 5,
                        color: 'var(--text-tertiary)',
                      }} />
                    )}
                    {table.status === 'HeldByYou' && (
                      <Check size={9} aria-hidden="true" style={{
                        position: 'absolute', top: 4, right: 5,
                        color: 'var(--color-success)',
                      }} />
                    )}
                    {table.status === 'Held' && (
                      <Clock size={9} aria-hidden="true" style={{
                        position: 'absolute', top: 4, right: 5,
                        color: 'var(--color-warning)',
                      }} />
                    )}

                    {/* Spinner while holding */}
                    {isHolding && (
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: 'inherit',
                        background: 'color-mix(in srgb, var(--bg-primary) 30%, transparent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1,
                      }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          border: '2px solid var(--border)',
                          borderTopColor: 'var(--accent-primary)',
                          animation: 'spin 0.7s linear infinite',
                        }} />
                      </div>
                    )}

                    {/* Table label */}
                    <span style={{
                      fontSize: smallCell ? '0.75rem' : '0.875rem',
                      fontWeight: 800,
                      color: table.status === 'HeldByYou' ? 'var(--color-success)' : 'var(--text-primary)',
                      lineHeight: 1,
                      fontFamily: 'var(--font-display)',
                    }}>
                      {table.label}
                    </span>

                    {/* Capacity */}
                    {!smallCell && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 2,
                        fontSize: '0.5625rem', color: 'var(--text-secondary)', lineHeight: 1,
                      }}>
                        <Users size={8} aria-hidden="true" />
                        <span>{table.capacity}</span>
                      </div>
                    )}

                    {/* Price */}
                    <span style={{
                      fontSize: smallCell ? '0.5625rem' : '0.6875rem',
                      fontWeight: 700,
                      color: table.status === 'HeldByYou' ? 'var(--color-success)' : `color-mix(in srgb, ${table.color ?? 'var(--accent-primary)'} 80%, var(--text-primary))`,
                      lineHeight: 1,
                    }}>
                      {formatCents(table.priceCents)}
                    </span>

                    {/* Countdown timer chip for user's hold */}
                    {table.status === 'HeldByYou' && table.holdExpiresAt && (
                      <div style={{
                        position: 'absolute',
                        bottom: -11,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--color-success)',
                        color: 'var(--bg-primary)',
                        borderRadius: '999px',
                        padding: '0.1rem 0.4rem',
                        fontSize: '0.5rem',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        boxShadow: '0 2px 8px color-mix(in srgb, var(--color-success) 40%, transparent)',
                      }}>
                        <Clock size={7} />
                        <Countdown expiresAt={table.holdExpiresAt} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Selected table info bar ───────────────────────────────────────── */}
      {myTable && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: 'color-mix(in srgb, var(--color-success) 10%, var(--bg-secondary))',
          border: '1px solid var(--color-success)',
          borderRadius: '0.75rem',
          gap: '0.75rem',
          animation: 'pulse-ring 2s ease infinite',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 32, height: 32,
              borderRadius: myTable.shape === 'Round' || myTable.shape === 'Cocktail' ? '50%' : '0.375rem',
              background: `color-mix(in srgb, ${myTable.color ?? 'var(--accent-primary)'} 20%, var(--bg-secondary))`,
              border: `2px solid var(--color-success)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Check size={14} style={{ color: 'var(--color-success)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Table {myTable.label} selected
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={10} />
                {myTable.capacity} seats
                <span style={{ opacity: 0.5 }}>·</span>
                {formatCents(myTable.priceCents)}/{myTable.priceType === 'PerSeat' ? 'seat' : 'table'}
                {myTable.holdExpiresAt && (
                  <>
                    <span style={{ opacity: 0.5 }}>·</span>
                    <Clock size={10} style={{ color: 'var(--color-warning)' }} />
                    <Countdown expiresAt={myTable.holdExpiresAt} />
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => void handleTableClick(myTable)}
            style={{
              padding: '0.3rem 0.6rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--color-error)',
              background: 'color-mix(in srgb, var(--color-error) 10%, var(--bg-secondary))',
              border: '1px solid color-mix(in srgb, var(--color-error) 30%, transparent)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              flexShrink: 0,
            }}
          >
            Release
          </button>
        </div>
      )}

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {/* Status legend */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
        }}>
          {[
            { color: 'var(--accent-primary)', label: 'Available', shape: 'dot' },
            { color: 'var(--color-success)', label: 'Your Pick', shape: 'dot' },
            { color: 'var(--color-warning)', label: 'Held', shape: 'dash' },
            { color: 'var(--text-tertiary)', label: 'Booked', shape: 'x' },
          ].map(({ color, label, shape }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {shape === 'dash' ? (
                <span style={{ width: 16, height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="8" viewBox="0 0 16 8">
                    <rect x="0" y="3" width="16" height="2" rx="1"
                      stroke={color} strokeWidth="1.5" fill="none"
                      strokeDasharray="3 2" />
                  </svg>
                </span>
              ) : shape === 'x' ? (
                <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--bg-tertiary)', border: `1.5px solid ${color}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="6" height="6" viewBox="0 0 6 6"><path d="M1 1l4 4M5 1l-4 4" stroke={color} strokeWidth="1.2" strokeLinecap="round"/></svg>
                </span>
              ) : (
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
              )}
              {label}
            </div>
          ))}
        </div>

        {/* Price tier legend */}
        {tiers.length > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {tiers.map(t => (
              <div key={t.price} style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                background: `color-mix(in srgb, ${t.color} 10%, var(--bg-secondary))`,
                border: `1px solid color-mix(in srgb, ${t.color} 35%, transparent)`,
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, display: 'inline-block', flexShrink: 0 }} />
                {formatCents(t.price)}/{t.type === 'PerSeat' ? 'seat' : 'table'}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row distance indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.6rem',
        color: 'var(--text-tertiary)',
        letterSpacing: '0.05em',
        opacity: 0.6,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <ChevronDown size={10} aria-hidden="true" style={{ transform: 'rotate(180deg)' }} />
          FRONT
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          BACK
          <ChevronDown size={10} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}
