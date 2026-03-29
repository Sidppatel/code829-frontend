import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Pencil,
  Check,
  X,
  CheckCircle2,
  XCircle,
  Users,
  Ticket,
  Grid3X3,
  Calendar,
  MapPin,
  Tag,
  Settings,
  LayoutDashboard,
  DollarSign,
  Copy,
  RotateCcw,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import AnimatedCounter from '../../components/AnimatedCounter';

const PricingStep = lazy(() => import('./editors/PricingStep'));

// ─── Types ────────────────────────────────────────────────────────────────────

type EventStatus = 'Draft' | 'Published' | 'Cancelled' | 'Completed';
type LayoutMode = 'Grid' | 'CapacityOnly' | 'None';
type TabKey = 'overview' | 'bookings' | 'layout' | 'pricing' | 'settings';

interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface EventDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: EventStatus;
  category: string;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  bannerImageUrl: string | null;
  isFeatured: boolean;
  layoutMode: LayoutMode;
  maxCapacity: number | null;
  platformFeePercent: number;
  publishedAt: string | null;
  venueId: string;
  venue: Venue | null;
}

interface LayoutTable {
  id: string;
  label: string;
  capacity: number;
  shape: string;
  gridRow: number | null;
  gridCol: number | null;
  tableTypeId: string | null;
  color: string | null;
}

interface LayoutData {
  gridRows: number | null;
  gridCols: number | null;
  tables: LayoutTable[];
}

interface EventStats {
  totalCapacity: number;
  ticketsSold: number;
  revenueCents: number;
  checkIns: number;
}

interface BookingItemDto {
  id: string;
  ticketTypeName: string;
  priceCents: number;
  seatId: string | null;
}

interface PaymentDto {
  id: string;
  status: string;
  amountCents: number;
  paidAt: string | null;
  refundedAt: string | null;
}

interface BookingDto {
  id: string;
  bookingNumber: string;
  status: string;
  userId: string;
  userName: string;
  eventId: string;
  eventTitle: string;
  subtotalCents: number;
  feeCents: number;
  totalCents: number;
  qrToken: string | null;
  items: BookingItemDto[];
  payment: PaymentDto | null;
  createdAt: string;
}

interface PagedBookings {
  items: BookingDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateRange(startIso: string, endIso: string): string {
  try {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const dayOpts: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    const timeOpts: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    return `${start.toLocaleDateString('en-US', dayOpts)} · ${start.toLocaleTimeString('en-US', timeOpts)} – ${end.toLocaleTimeString('en-US', timeOpts)}`;
  } catch {
    return startIso;
  }
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(cents / 100);
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: EventStatus }): React.ReactElement {
  const map: Record<EventStatus, { color: string }> = {
    Draft: { color: 'var(--text-tertiary)' },
    Published: { color: 'var(--color-success)' },
    Cancelled: { color: 'var(--color-error)' },
    Completed: { color: 'var(--color-info)' },
  };
  const { color } = map[status];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.2rem 0.65rem',
        borderRadius: '999px',
        fontSize: '0.775rem',
        fontWeight: 700,
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        color,
        letterSpacing: '0.02em',
      }}
    >
      <span
        style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }}
      />
      {status}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  prefix,
  suffix,
  color,
  icon,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  color: string;
  icon: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--border)',
        borderRadius: '0.875rem',
        padding: '1.25rem',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '0.775rem',
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '0.5rem',
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
            color,
          }}
        >
          {icon}
        </span>
      </div>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        <AnimatedCounter target={value} prefix={prefix ?? ''} suffix={suffix ?? ''} />
      </span>
    </div>
  );
}

// ─── Cancel modal ─────────────────────────────────────────────────────────────

function CancelModal({
  eventTitle,
  onCancel,
  onConfirm,
  confirming,
}: {
  eventTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirming: boolean;
}): React.ReactElement {
  const [typed, setTyped] = useState('');
  const matches = typed === eventTitle;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'color-mix(in srgb, var(--bg-primary) 65%, transparent)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 400,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
          padding: '1.75rem',
          maxWidth: '460px',
          width: '100%',
          boxShadow: 'var(--shadow-card-hover)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'color-mix(in srgb, var(--color-error) 15%, transparent)',
              color: 'var(--color-error)',
            }}
          >
            <XCircle size={18} />
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Cancel Event
          </h2>
        </div>

        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: '0 0 1rem',
          }}
        >
          This will cancel the event and notify all attendees. This action cannot be undone.
        </p>

        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            margin: '0 0 0.5rem',
          }}
        >
          Type{' '}
          <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            {eventTitle}
          </strong>{' '}
          to confirm:
        </p>

        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Event title…"
          autoFocus
          style={{
            width: '100%',
            padding: '0.6rem 0.875rem',
            borderRadius: '0.5rem',
            border: `1px solid ${matches && typed ? 'var(--color-error)' : 'var(--border)'}`,
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: '1.25rem',
          }}
        />

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
            }}
          >
            Keep Event
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!matches || confirming}
            style={{
              padding: '0.5rem 1.375rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: matches ? 'var(--color-error)' : 'var(--bg-tertiary)',
              color: matches ? 'var(--bg-primary)' : 'var(--text-tertiary)',
              cursor: !matches || confirming ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              fontWeight: 700,
              opacity: confirming ? 0.7 : 1,
              transition: 'background 0.2s',
            }}
          >
            {confirming ? 'Cancelling…' : 'Cancel Event'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Layout grid display ──────────────────────────────────────────────────────

function ReadOnlyLayoutGrid({ tables, gridRows, gridCols }: {
  tables: LayoutTable[]; gridRows: number; gridCols: number;
}): React.ReactElement {
  if (tables.length === 0) {
    return (
      <div style={{
        padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)',
        fontSize: '0.875rem', border: '1px dashed var(--border)', borderRadius: '0.75rem',
      }}>
        No tables configured.
      </div>
    );
  }

  // Build a lookup: "row,col" -> table
  const cellMap = new Map<string, LayoutTable>();
  for (const t of tables) {
    if (t.gridRow != null && t.gridCol != null) {
      cellMap.set(`${t.gridRow},${t.gridCol}`, t);
    }
  }

  const CELL = 64;
  const GAP = 4;

  return (
    <div style={{
      overflowX: 'auto', overflowY: 'auto', border: '1px solid var(--border)',
      borderRadius: '0.75rem', background: 'var(--bg-tertiary)', maxHeight: '420px', padding: '0.5rem',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCols}, ${CELL}px)`,
        gridTemplateRows: `repeat(${gridRows}, ${CELL}px)`,
        gap: `${GAP}px`,
        width: 'fit-content',
      }}>
        {Array.from({ length: gridRows * gridCols }).map((_, idx) => {
          const r = Math.floor(idx / gridCols);
          const c = idx % gridCols;
          const t = cellMap.get(`${r},${c}`);
          const fill = t?.color ?? 'var(--accent-primary)';

          return (
            <div
              key={`${r}-${c}`}
              style={{
                width: `${CELL}px`, height: `${CELL}px`,
                borderRadius: t?.shape === 'Round' || t?.shape === 'Cocktail' ? '50%' : '0.375rem',
                background: t
                  ? `color-mix(in srgb, ${fill} 20%, var(--bg-secondary))`
                  : 'var(--bg-secondary)',
                border: t ? `2px solid ${fill}` : '1px solid var(--border)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6875rem', fontWeight: 700,
                color: t ? fill : 'transparent',
                opacity: t ? 1 : 0.4,
              }}
            >
              {t && (
                <>
                  <span>{t.label}</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 500, opacity: 0.8 }}>
                    {t.capacity}s
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EventManagePage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'overview';

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [layoutData, setLayoutData] = useState<LayoutData | null>(null);
  const [layoutLoading, setLayoutLoading] = useState(false);
  const [stats, setStats] = useState<EventStats>({
    totalCapacity: 0,
    ticketsSold: 0,
    revenueCents: 0,
    checkIns: 0,
  });
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsStatusFilter, setBookingsStatusFilter] = useState<string>('');
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [confirmRefundId, setConfirmRefundId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [feeOverride, setFeeOverride] = useState('');
  const [savingFee, setSavingFee] = useState(false);

  const fetchEvent = useCallback(async (): Promise<void> => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient.get<EventDetail>(`/admin/events/${id}`);
      setEvent(res.data);
      setFeeOverride(String(res.data.platformFeePercent ?? 0));
    } catch {
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchEvent();
  }, [fetchEvent]);

  // Load layout when on layout tab or when Grid mode
  useEffect(() => {
    if (!id || !event || event.layoutMode !== 'Grid') return;
    let cancelled = false;
    setLayoutLoading(true);

    async function loadLayout(): Promise<void> {
      try {
        const res = await apiClient.get<LayoutData>(`/admin/events/${id}/layout`);
        if (!cancelled) setLayoutData(res.data);
      } catch {
        // non-fatal
      } finally {
        if (!cancelled) setLayoutLoading(false);
      }
    }

    void loadLayout();
    return () => { cancelled = true; };
  }, [id, event]);

  // Compute stats from bookings
  useEffect(() => {
    if (!id || !event) return;
    let cancelled = false;

    async function loadStats(): Promise<void> {
      try {
        const res = await apiClient.get<PagedBookings>(`/admin/bookings?eventId=${id}&pageSize=100`);
        if (cancelled) return;
        const all = res.data.items ?? [];
        const paid = all.filter(b => b.status === 'Paid' || b.status === 'CheckedIn');
        const checkedIn = all.filter(b => b.status === 'CheckedIn');
        const revenue = paid.reduce((sum, b) => sum + b.totalCents, 0);
        const ticketsSold = paid.reduce((sum, b) => sum + (b.items?.length ?? 0), 0);

        setStats({
          totalCapacity: event?.maxCapacity ?? 0,
          ticketsSold,
          revenueCents: revenue,
          checkIns: checkedIn.length,
        });
      } catch {
        if (!cancelled) {
          setStats({
            totalCapacity: event?.maxCapacity ?? 0,
            ticketsSold: 0,
            revenueCents: 0,
            checkIns: 0,
          });
        }
      }
    }

    void loadStats();
    return () => { cancelled = true; };
  }, [id, event]);

  // Load bookings when on bookings tab
  useEffect(() => {
    if (!id || activeTab !== 'bookings') return;
    let cancelled = false;
    setBookingsLoading(true);

    async function loadBookings(): Promise<void> {
      try {
        const params = new URLSearchParams({
          page: String(bookingsPage),
          pageSize: '15',
          eventId: id!,
        });
        if (bookingsStatusFilter) params.set('status', bookingsStatusFilter);
        const res = await apiClient.get<PagedBookings>(`/admin/bookings?${params}`);
        if (!cancelled) {
          setBookings(res.data.items ?? []);
          setBookingsTotal(res.data.totalCount ?? 0);
        }
      } catch {
        // non-fatal
      } finally {
        if (!cancelled) setBookingsLoading(false);
      }
    }

    void loadBookings();
    return () => { cancelled = true; };
  }, [id, activeTab, bookingsPage, bookingsStatusFilter]);

  async function handleRefund(bookingId: string): Promise<void> {
    setRefundingId(bookingId);
    try {
      await apiClient.post(`/admin/bookings/${bookingId}/refund`);
      toast.success('Booking refunded successfully');
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, status: 'Refunded', payment: b.payment ? { ...b.payment, status: 'Refunded', refundedAt: new Date().toISOString() } : null } : b
      ));
      setConfirmRefundId(null);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to refund booking';
      toast.error(msg);
    } finally {
      setRefundingId(null);
    }
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  async function handlePublish(): Promise<void> {
    if (!id) return;
    setPublishing(true);
    try {
      await apiClient.put(`/admin/events/${id}/status`, { status: 'Published' });
      toast.success('Event published');
      void fetchEvent();
    } catch {
      toast.error('Failed to publish event');
    } finally {
      setPublishing(false);
    }
  }

  async function handleComplete(): Promise<void> {
    if (!id) return;
    setCompleting(true);
    try {
      await apiClient.put(`/admin/events/${id}/status`, { status: 'Completed' });
      toast.success('Event marked as Completed');
      void fetchEvent();
    } catch {
      toast.error('Failed to complete event');
    } finally {
      setCompleting(false);
    }
  }

  async function handleCancelConfirm(): Promise<void> {
    if (!id) return;
    setCancelling(true);
    try {
      await apiClient.put(`/admin/events/${id}/status`, { status: 'Cancelled' });
      toast.success('Event cancelled');
      setShowCancelModal(false);
      void fetchEvent();
    } catch {
      toast.error('Failed to cancel event');
    } finally {
      setCancelling(false);
    }
  }

  async function handleSaveFeeOverride(): Promise<void> {
    if (!id || !event) return;
    const val = parseFloat(feeOverride);
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error('Fee must be between 0 and 100');
      return;
    }
    setSavingFee(true);
    try {
      await apiClient.put(`/admin/events/${id}`, {
        title: event.title,
        description: event.description,
        category: event.category,
        startDate: event.startDate,
        endDate: event.endDate,
        venueId: event.venueId,
        layoutMode: event.layoutMode,
        platformFeePercent: val,
        isFeatured: event.isFeatured,
        bannerImageUrl: event.bannerImageUrl,
        maxCapacity: event.maxCapacity,
      });
      toast.success('Fee override saved');
      void fetchEvent();
    } catch {
      toast.error('Failed to save fee override');
    } finally {
      setSavingFee(false);
    }
  }

  // ─── Tabs ─────────────────────────────────────────────────────────────────

  const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
    { key: 'bookings', label: 'Bookings', icon: <Ticket size={15} /> },
    { key: 'layout', label: 'Layout', icon: <Grid3X3 size={15} /> },
    // Pricing tab hidden for assigned seating — pricing is set per-table in the grid editor
    ...(event?.layoutMode !== 'Grid' ? [{ key: 'pricing' as TabKey, label: 'Pricing', icon: <DollarSign size={15} /> }] : []),
    { key: 'settings', label: 'Settings', icon: <Settings size={15} /> },
  ];

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: i === 1 ? '60px' : '80px',
                borderRadius: '0.75rem',
                background: 'var(--bg-tertiary)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
        Event not found.{' '}
        <Link to="/admin/events" style={{ color: 'var(--accent-primary)' }}>
          Back to Events
        </Link>
      </div>
    );
  }

  const isEndedEvent =
    event.endDate ? new Date(event.endDate) <= new Date() : false;

  const totalTables = layoutData?.tables?.length ?? 0;
  const totalSeats = layoutData?.tables?.reduce((sum, t) => sum + (t.capacity ?? 0), 0) ?? 0;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.75rem',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
            <StatusBadge status={event.status} />
            {event.isFeatured && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  background: 'color-mix(in srgb, var(--color-yellow) 15%, transparent)',
                  color: 'var(--color-yellow)',
                  border: '1px solid color-mix(in srgb, var(--color-yellow) 30%, transparent)',
                  letterSpacing: '0.03em',
                }}
              >
                FEATURED
              </span>
            )}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.875rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {event.title}
          </h1>
          {event.venue && (
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <MapPin size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
              {event.venue.name} · {event.venue.city}, {event.venue.state}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          {/* Edit button */}
          <Link
            to={`/admin/events/${event.id}/edit`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'background 0.15s',
            }}
          >
            <Pencil size={14} />
            Edit Event
          </Link>

          {/* Status action buttons */}
          {event.status === 'Draft' && (
            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={publishing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'var(--color-success)',
                color: 'var(--bg-primary)',
                cursor: publishing ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: 700,
                opacity: publishing ? 0.7 : 1,
              }}
            >
              <CheckCircle2 size={14} />
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
          )}

          {event.status === 'Published' && isEndedEvent && (
            <button
              type="button"
              onClick={() => void handleComplete()}
              disabled={completing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'var(--color-info)',
                color: 'var(--bg-primary)',
                cursor: completing ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: 700,
                opacity: completing ? 0.7 : 1,
              }}
            >
              <Check size={14} />
              {completing ? 'Completing…' : 'Mark Complete'}
            </button>
          )}

          {event.status === 'Published' && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid color-mix(in srgb, var(--color-error) 40%, transparent)',
                background: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
                color: 'var(--color-error)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: 700,
              }}
            >
              <X size={14} />
              Cancel Event
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '0.125rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '0.625rem',
          padding: '0.25rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.4rem',
              border: 'none',
              background: activeTab === tab.key ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === tab.key ? 'var(--bg-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              fontWeight: activeTab === tab.key ? 700 : 400,
              transition: 'background 0.15s, color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Stats grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            <StatCard
              label="Total Capacity"
              value={stats.totalCapacity}
              color="var(--accent-primary)"
              icon={<Users size={16} />}
            />
            <StatCard
              label="Tickets Sold"
              value={stats.ticketsSold}
              color="var(--color-success)"
              icon={<Ticket size={16} />}
            />
            <StatCard
              label="Revenue"
              value={Math.round(stats.revenueCents / 100)}
              prefix="$"
              color="var(--color-warning)"
              icon={<DollarSign size={16} />}
            />
            <StatCard
              label="Check-ins"
              value={stats.checkIns}
              color="var(--color-info)"
              icon={<Check size={16} />}
            />
          </div>

          {/* Event details summary */}
          <div
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--border)',
              borderRadius: '0.875rem',
              padding: '1.25rem',
              backdropFilter: 'blur(8px)',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 1rem',
              }}
            >
              Event Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <DetailRow label="Category">
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
                    color: 'var(--accent-primary)',
                    border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)',
                  }}
                >
                  <Tag size={11} />
                  {event.category}
                </span>
              </DetailRow>

              <DetailRow label="Date & Time">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Calendar size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                  {formatDateRange(event.startDate, event.endDate)}
                </span>
              </DetailRow>

              {event.venue && (
                <DetailRow label="Venue">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <MapPin size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    {event.venue.name} · {event.venue.city}, {event.venue.state}
                  </span>
                </DetailRow>
              )}

              <DetailRow label="Layout">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  {event.layoutMode === 'Grid' && <Grid3X3 size={13} style={{ color: 'var(--text-tertiary)' }} />}
                  {event.layoutMode === 'CapacityOnly' && <Users size={13} style={{ color: 'var(--text-tertiary)' }} />}
                  {event.layoutMode === 'None' && <Ticket size={13} style={{ color: 'var(--text-tertiary)' }} />}
                  {event.layoutMode === 'Grid'
                    ? 'Assigned Seating'
                    : event.layoutMode === 'CapacityOnly'
                    ? `General Admission${event.maxCapacity ? ` · ${event.maxCapacity} guests` : ''}`
                    : 'Tickets Only'}
                </span>
              </DetailRow>

              <DetailRow label="Description" last>
                <span style={{ lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  {event.description}
                </span>
              </DetailRow>
            </div>
          </div>
        </div>
      )}

      {/* ── Bookings Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'bookings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Header + filters */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700,
              color: 'var(--text-primary)', margin: 0,
            }}>
              Bookings {bookingsTotal > 0 && <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>({bookingsTotal})</span>}
            </h3>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {['', 'Paid', 'CheckedIn', 'Pending', 'Cancelled', 'Refunded'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setBookingsStatusFilter(s); setBookingsPage(1); }}
                  style={{
                    padding: '0.3rem 0.65rem', borderRadius: '999px', border: '1px solid var(--border)',
                    background: bookingsStatusFilter === s ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: bookingsStatusFilter === s ? '#fff' : 'var(--text-secondary)',
                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}
                >{s || 'All'}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          {bookingsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{
                  height: '52px', borderRadius: '0.5rem', background: 'var(--bg-tertiary)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div style={{
              padding: '2.5rem', textAlign: 'center', color: 'var(--text-tertiary)',
              fontSize: '0.875rem', border: '1px dashed var(--border)', borderRadius: '0.75rem',
            }}>
              {bookingsStatusFilter ? 'No bookings with this status.' : 'No bookings yet for this event.'}
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '0.75rem', overflow: 'hidden',
            }}>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.7fr 0.6fr 0.5fr 0.6fr',
                gap: '0.75rem', padding: '0.65rem 1rem',
                borderBottom: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: 'var(--text-tertiary)',
              }}>
                <span>Customer</span>
                <span>Items</span>
                <span>Amount</span>
                <span>Status</span>
                <span>Date</span>
                <span>Actions</span>
              </div>

              {/* Rows */}
              {bookings.map((b, i) => {
                const statusColors: Record<string, string> = {
                  Paid: 'var(--color-success)', CheckedIn: 'var(--accent-primary)',
                  Pending: 'var(--color-warning)', Cancelled: 'var(--color-error)',
                  Refunded: 'var(--text-tertiary)',
                };
                const sColor = statusColors[b.status] ?? 'var(--text-tertiary)';
                return (
                  <div
                    key={b.id}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.7fr 0.6fr 0.5fr 0.6fr',
                      gap: '0.75rem', padding: '0.65rem 1rem', alignItems: 'center',
                      borderBottom: i < bookings.length - 1 ? '1px solid var(--border)' : 'none',
                      fontSize: '0.8125rem',
                    }}
                  >
                    {/* Customer */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600, color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{b.userName}</div>
                      <div style={{
                        fontSize: '0.7rem', color: 'var(--text-tertiary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>#{b.bookingNumber}</div>
                    </div>

                    {/* Items */}
                    <div style={{ minWidth: 0 }}>
                      {(b.items ?? []).length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                          {(b.items ?? []).slice(0, 2).map((item, idx) => (
                            <span key={idx} style={{
                              fontSize: '0.75rem', color: 'var(--text-secondary)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {item.ticketTypeName} · {formatCents(item.priceCents)}
                            </span>
                          ))}
                          {(b.items ?? []).length > 2 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                              +{(b.items ?? []).length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>—</span>
                      )}
                    </div>

                    {/* Amount */}
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      {formatCents(b.totalCents)}
                    </span>

                    {/* Status */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.6875rem',
                      fontWeight: 700, background: `color-mix(in srgb, ${sColor} 12%, transparent)`,
                      color: sColor, width: 'fit-content',
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sColor }} />
                      {b.status}
                    </span>

                    {/* Date */}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>

                    {/* Actions */}
                    <div>
                      {b.status === 'Paid' && confirmRefundId !== b.id && (
                        <button
                          type="button"
                          onClick={() => setConfirmRefundId(b.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
                            border: '1px solid var(--border)', background: 'var(--bg-primary)',
                            color: 'var(--color-error)', fontSize: '0.6875rem', fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'var(--font-body)',
                          }}
                        >
                          <RotateCcw size={11} />
                          Refund
                        </button>
                      )}
                      {b.status === 'Paid' && confirmRefundId === b.id && (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            type="button"
                            onClick={() => void handleRefund(b.id)}
                            disabled={refundingId === b.id}
                            style={{
                              padding: '0.25rem 0.5rem', borderRadius: '0.375rem', border: 'none',
                              background: 'var(--color-error)', color: 'var(--bg-primary)',
                              fontSize: '0.6875rem', fontWeight: 700, cursor: refundingId === b.id ? 'not-allowed' : 'pointer',
                              fontFamily: 'var(--font-body)', opacity: refundingId === b.id ? 0.6 : 1,
                            }}
                          >
                            {refundingId === b.id ? 'Processing...' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRefundId(null)}
                            disabled={refundingId === b.id}
                            style={{
                              padding: '0.25rem 0.4rem', borderRadius: '0.375rem',
                              border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                              color: 'var(--text-secondary)', fontSize: '0.6875rem', cursor: 'pointer',
                              fontFamily: 'var(--font-body)',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {b.status !== 'Paid' && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {bookingsTotal > 15 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setBookingsPage(p => Math.max(1, p - 1))}
                disabled={bookingsPage <= 1}
                style={{
                  padding: '0.4rem 0.75rem', borderRadius: '0.375rem',
                  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                  color: bookingsPage <= 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  cursor: bookingsPage <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.8125rem', fontFamily: 'var(--font-body)',
                }}
              >Prev</button>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Page {bookingsPage} of {Math.ceil(bookingsTotal / 15)}
              </span>
              <button
                type="button"
                onClick={() => setBookingsPage(p => p + 1)}
                disabled={bookingsPage >= Math.ceil(bookingsTotal / 15)}
                style={{
                  padding: '0.4rem 0.75rem', borderRadius: '0.375rem',
                  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                  color: bookingsPage >= Math.ceil(bookingsTotal / 15) ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  cursor: bookingsPage >= Math.ceil(bookingsTotal / 15) ? 'not-allowed' : 'pointer',
                  fontSize: '0.8125rem', fontFamily: 'var(--font-body)',
                }}
              >Next</button>
            </div>
          )}
        </div>
      )}

      {/* ── Layout Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'layout' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: '0 0 0.25rem',
                }}
              >
                Floor Plan
              </h3>
              {event.layoutMode === 'Grid' && !layoutLoading && layoutData && (
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {totalTables} table{totalTables !== 1 ? 's' : ''} · {totalSeats} seat{totalSeats !== 1 ? 's' : ''}
                </p>
              )}
              {event.layoutMode === 'CapacityOnly' && (
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  General Admission · {event.maxCapacity ?? 0} guests max
                </p>
              )}
              {event.layoutMode === 'None' && (
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Tickets Only — no floor plan
                </p>
              )}
            </div>
            <Link
              to={`/admin/events/${event.id}/edit`}
              onClick={() => {
                // Navigate to wizard with step 2 pre-selected via URL state
              }}
              state={{ startStep: 2 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.45rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--accent-primary)',
                textDecoration: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              <Pencil size={13} />
              Edit Layout
            </Link>
          </div>

          {event.layoutMode === 'Grid' ? (
            layoutLoading ? (
              <div
                style={{
                  height: '300px',
                  borderRadius: '0.75rem',
                  background: 'var(--bg-tertiary)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  border: '1px solid var(--border)',
                }}
              />
            ) : (
              <ReadOnlyLayoutGrid
                tables={layoutData?.tables ?? []}
                gridRows={layoutData?.gridRows ?? 5}
                gridCols={layoutData?.gridCols ?? 5}
              />
            )
          ) : (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: '0.875rem',
                border: '1px dashed var(--border)',
                borderRadius: '0.75rem',
                background: 'var(--bg-secondary)',
              }}
            >
              {event.layoutMode === 'CapacityOnly'
                ? 'General Admission event — no visual floor plan.'
                : 'Tickets Only event — no floor plan needed.'}
            </div>
          )}
        </div>
      )}

      {/* ── Pricing Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'pricing' && (
        <div>
          <Suspense
            fallback={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: '80px',
                      borderRadius: '0.75rem',
                      background: 'var(--bg-tertiary)',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                  />
                ))}
              </div>
            }
          >
            <PricingStep
              eventId={event.id}
              layoutMode={event.layoutMode}
              maxCapacity={event.maxCapacity ?? undefined}
            />
          </Suspense>
        </div>
      )}

      {/* ── Settings Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Platform fee override */}
          <div
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--border)',
              borderRadius: '0.875rem',
              padding: '1.25rem',
              backdropFilter: 'blur(8px)',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 0.5rem',
              }}
            >
              Platform Fee Override
            </h3>
            <p
              style={{
                margin: '0 0 1rem',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              Override the default platform fee for this event (0–100%). Leave at 0 for no fee.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '140px', maxWidth: '200px' }}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={feeOverride}
                  onChange={(e) => setFeeOverride(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 2rem 0.6rem 0.875rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)',
                    fontSize: '0.875rem',
                    pointerEvents: 'none',
                  }}
                >
                  %
                </span>
              </div>
              <button
                type="button"
                onClick={() => void handleSaveFeeOverride()}
                disabled={savingFee}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: 'var(--accent-primary)',
                  color: 'var(--bg-primary)',
                  cursor: savingFee ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  opacity: savingFee ? 0.7 : 1,
                }}
              >
                {savingFee ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Event slug */}
          <div
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--border)',
              borderRadius: '0.875rem',
              padding: '1.25rem',
              backdropFilter: 'blur(8px)',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 0.5rem',
              }}
            >
              Event Slug
            </h3>
            <p
              style={{
                margin: '0 0 0.875rem',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
              }}
            >
              The URL-friendly identifier for this event (read-only).
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.6rem 0.875rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                background: 'var(--bg-tertiary)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {event.slug}
              </span>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(event.slug);
                  toast.success('Slug copied');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                title="Copy slug"
              >
                <Copy size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel modal ──────────────────────────────────────────────────── */}
      {showCancelModal && (
        <CancelModal
          eventTitle={event.title}
          onCancel={() => setShowCancelModal(false)}
          onConfirm={() => void handleCancelConfirm()}
          confirming={cancelling}
        />
      )}
    </div>
  );
}

// ─── Detail row helper ────────────────────────────────────────────────────────

function DetailRow({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.875rem',
        alignItems: 'flex-start',
        paddingBottom: last ? 0 : '0.625rem',
        borderBottom: last ? 'none' : '1px solid var(--border)',
        marginBottom: last ? 0 : '0.625rem',
      }}
    >
      <span
        style={{
          minWidth: '90px',
          fontSize: '0.775rem',
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          paddingTop: '0.15rem',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', flex: 1 }}>{children}</span>
    </div>
  );
}
