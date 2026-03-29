import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Pencil,
  Check,
  Users,
  Ticket,
  Grid3X3,
  Calendar,
  MapPin,
  Tag,
  LayoutDashboard,
  DollarSign,
  Search,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import AnimatedCounter from '../../components/AnimatedCounter';

const PricingStep = lazy(() => import('./editors/PricingStep'));
const ReadOnlyPlatformFees = lazy(() => import('./editors/ReadOnlyPlatformFees'));

// ─── Types ────────────────────────────────────────────────────────────────────

type EventStatus = 'Draft' | 'Published' | 'Cancelled' | 'Completed';
type LayoutMode = 'Grid' | 'CapacityOnly' | 'None';
type TabKey = 'overview' | 'bookings' | 'layout' | 'pricing' | 'fees';

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
  ticketTypes: TicketTypeDto[];
}

interface TicketTypeDto {
  id: string;
  name: string;
  priceCents: number;
  platformFeeCents: number;
  quantityTotal: number;
  quantitySold: number;
  sortOrder: number;
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
  priceCents: number;
  platformFeeCents: number;
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
  const [bookingsSearchInput, setBookingsSearchInput] = useState('');
  const [bookingsSearch, setBookingsSearch] = useState('');


  const fetchEvent = useCallback(async (): Promise<void> => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient.get<EventDetail>(`/admin/events/${id}`);
      setEvent(res.data);
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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setBookingsSearch(bookingsSearchInput);
      setBookingsPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [bookingsSearchInput]);

  // Load stats from lightweight endpoint (no full booking data)
  useEffect(() => {
    if (!id || !event) return;
    let cancelled = false;

    async function loadStats(): Promise<void> {
      try {
        const res = await apiClient.get<{ total: number; paid: number; checkedIn: number; revenue: number; ticketsSold: number }>(
          `/admin/bookings/stats?eventId=${id}`
        );
        if (cancelled) return;
        setStats({
          totalCapacity: event?.maxCapacity ?? 0,
          ticketsSold: res.data.ticketsSold,
          revenueCents: res.data.revenue,
          checkIns: res.data.checkedIn,
        });
      } catch {
        if (!cancelled) {
          setStats({ totalCapacity: event?.maxCapacity ?? 0, ticketsSold: 0, revenueCents: 0, checkIns: 0 });
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
        if (bookingsSearch.trim()) params.set('search', bookingsSearch.trim());
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
  }, [id, activeTab, bookingsPage, bookingsStatusFilter, bookingsSearch]);



  // ─── Tabs ─────────────────────────────────────────────────────────────────

  const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
    { key: 'bookings', label: 'Bookings', icon: <Ticket size={15} /> },
    { key: 'layout', label: 'Layout', icon: <Grid3X3 size={15} /> },
    // Pricing tab hidden for assigned seating — pricing is set per-table in the grid editor
    ...(event?.layoutMode !== 'Grid' ? [{ key: 'pricing' as TabKey, label: 'Pricing', icon: <DollarSign size={15} /> }] : []),
    { key: 'fees' as TabKey, label: 'Platform Fees', icon: <DollarSign size={15} /> },
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
          {/* Header + search + filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search by booking #, customer name, email..."
                value={bookingsSearchInput}
                onChange={e => setBookingsSearchInput(e.target.value)}
                style={{
                  width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                  borderRadius: '0.5rem', border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)', fontSize: '0.8125rem', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
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
              {bookingsSearch ? `No bookings matching "${bookingsSearch}"` : bookingsStatusFilter ? 'No bookings with this status.' : 'No bookings yet for this event.'}
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '0.75rem', overflow: 'hidden',
            }}>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.7fr 0.6fr 0.5fr',
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
                      display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.7fr 0.6fr 0.5fr',
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
      )}      {/* ── Fees Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'fees' && (
        <div style={{ marginTop: '0.5rem' }}>
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
            <ReadOnlyPlatformFees
              layoutMode={event.layoutMode}
              ticketTypes={event.ticketTypes || []}
              tables={layoutData?.tables || []}
            />
          </Suspense>
        </div>
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
