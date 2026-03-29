import React, { useEffect, useState, useCallback } from 'react';
import { Circle, Square, RectangleHorizontal, Diamond, Clock, Lock, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/axios';
import { useAuthStore } from '../stores/authStore';

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

function ShapeIcon({ shape, size = 18 }: { shape: string; size?: number }): React.ReactElement {
  switch (shape) {
    case 'Rectangle': return <RectangleHorizontal size={size} />;
    case 'Square': return <Square size={size} />;
    case 'Cocktail': return <Diamond size={size} />;
    default: return <Circle size={size} />;
  }
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

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

  return <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem' }}>{remaining}</span>;
}

export default function TableSelectionView({ eventId, ticketTypeId, onTableSelected }: Props): React.ReactElement {
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<TablesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [holdingId, setHoldingId] = useState<string | null>(null);

  const loadTables = useCallback(async () => {
    try {
      const res = await apiClient.get<TablesResponse>(`/events/${eventId}/tables`);
      setData(res.data);
    } catch {
      toast.error('Failed to load seating layout');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void loadTables(); }, [loadTables]);

  // Poll every 15s to refresh statuses
  useEffect(() => {
    const id = setInterval(() => { void loadTables(); }, 15000);
    return () => clearInterval(id);
  }, [loadTables]);

  // Notify parent when a table is held by user
  useEffect(() => {
    if (!data) return;
    const held = data.tables.find(t => t.status === 'HeldByYou');
    onTableSelected(held ?? null);
  }, [data, onTableSelected]);

  async function handleTableClick(table: EventTable): Promise<void> {
    if (!isAuthenticated) {
      toast.error('Please log in to select a table');
      return;
    }
    if (table.status === 'Held' || table.status === 'Booked') return;

    if (table.status === 'HeldByYou') {
      // Release
      setHoldingId(table.id);
      try {
        await apiClient.post('/seats/release-table', { eventId, tableId: table.id });
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
      try {
        await apiClient.post('/seats/release-table', { eventId, tableId: currentHold.id });
      } catch { /* ignore */ }
    }

    // Hold the new table
    setHoldingId(table.id);
    try {
      await apiClient.post('/seats/hold-table', { eventId, tableId: table.id, ticketTypeId });
      await loadTables();
      toast.success(`Table ${table.label} reserved for you`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to hold table';
      toast.error(msg);
      await loadTables();
    } finally {
      setHoldingId(null);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent-primary)', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
      </div>
    );
  }

  if (!data || data.tables.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>No seating layout available.</div>;
  }

  const { gridRows, gridCols, tables } = data;
  const cellSize = 80;
  const gap = 6;

  // Build occupancy map
  const occupancy = new Map<string, EventTable>();
  for (const t of tables) {
    if (t.gridRow !== null && t.gridCol !== null) {
      occupancy.set(`${t.gridRow}-${t.gridCol}`, t);
    }
  }

  const statusStyles = (t: EventTable) => {
    const isHolding = holdingId === t.id;
    switch (t.status) {
      case 'Available':
        return {
          bg: `color-mix(in srgb, ${t.color ?? 'var(--accent-primary)'} 15%, var(--bg-secondary))`,
          border: `2px solid ${t.color ?? 'var(--accent-primary)'}`,
          cursor: isHolding ? 'wait' : 'pointer' as const,
          opacity: isHolding ? 0.7 : 1,
        };
      case 'HeldByYou':
        return {
          bg: 'color-mix(in srgb, var(--color-success) 15%, var(--bg-secondary))',
          border: '2px solid var(--color-success)',
          cursor: 'pointer' as const,
          opacity: 1,
        };
      case 'Held':
        return {
          bg: 'color-mix(in srgb, var(--color-warning) 12%, var(--bg-secondary))',
          border: '2px dashed var(--color-warning)',
          cursor: 'not-allowed' as const,
          opacity: 0.7,
        };
      case 'Booked':
        return {
          bg: 'var(--bg-tertiary)',
          border: '2px solid var(--border)',
          cursor: 'not-allowed' as const,
          opacity: 0.5,
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        {[
          { color: 'var(--accent-primary)', label: 'Available' },
          { color: 'var(--color-success)', label: 'Your Selection' },
          { color: 'var(--color-warning)', label: 'Reserved' },
          { color: 'var(--text-tertiary)', label: 'Booked' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ overflow: 'auto', padding: '0.5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridCols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gridRows}, ${cellSize}px)`,
          gap: `${gap}px`,
          width: 'fit-content',
        }}>
          {Array.from({ length: gridRows * gridCols }, (_, idx) => {
            const r = Math.floor(idx / gridCols);
            const c = idx % gridCols;
            const table = occupancy.get(`${r}-${c}`);

            if (!table) {
              return <div key={`${r}-${c}`} style={{ width: cellSize, height: cellSize }} />;
            }

            const styles = statusStyles(table);
            return (
              <div
                key={table.id}
                onClick={() => void handleTableClick(table)}
                title={`${table.label} · ${table.capacity} seats · ${formatCents(table.priceCents)} ${table.priceType === 'PerSeat' ? '/seat' : '/table'}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: table.shape === 'Round' || table.shape === 'Cocktail' ? '50%' : '0.5rem',
                  background: styles.bg,
                  border: styles.border,
                  cursor: styles.cursor,
                  opacity: styles.opacity,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.15rem',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Status icon */}
                {table.status === 'Booked' && (
                  <Lock size={12} style={{ position: 'absolute', top: 4, right: 4, color: 'var(--text-tertiary)' }} />
                )}
                {table.status === 'HeldByYou' && (
                  <Check size={12} style={{ position: 'absolute', top: 4, right: 4, color: 'var(--color-success)' }} />
                )}

                <ShapeIcon shape={table.shape} size={16} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {table.label}
                </span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', lineHeight: 1 }}>
                  {table.capacity} seats
                </span>
                <span style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--accent-primary)', lineHeight: 1 }}>
                  {formatCents(table.priceCents)}
                </span>

                {/* Countdown for user's hold */}
                {table.status === 'HeldByYou' && table.holdExpiresAt && (
                  <div style={{
                    position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--color-success)', color: '#fff', borderRadius: '999px',
                    padding: '0.1rem 0.4rem', fontSize: '0.6rem', whiteSpace: 'nowrap',
                  }}>
                    <Clock size={8} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                    <Countdown expiresAt={table.holdExpiresAt} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
