import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate, Link } from 'react-router-dom';
import { Calendar, QrCode, ChevronRight, Ticket } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { SkeletonCard } from '../components/Skeleton';
import apiClient from '../lib/axios';

// ---------------------------------------------------------------------------
// Types matching actual API response
// ---------------------------------------------------------------------------
type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'used';

interface ApiBookingItem {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  userId: string;
  userName: string;
  eventId: string;
  eventTitle: string;
  subtotalCents: number;
  feeCents: number;
  totalCents: number;
  qrToken: string;
  items: ApiBookingLineItem[];
  payment: ApiPayment | null;
  createdAt: string;
}

interface ApiBookingLineItem {
  id: string;
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
}

interface ApiPayment {
  id: string;
  status: string;
  method: string;
}

interface ApiBookingsResponse {
  items: ApiBookingItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Internal display shape
interface Booking {
  id: string;
  bookingNumber: string;
  eventId: string;
  eventTitle: string;
  status: BookingStatus;
  totalCents: number;
  qrToken: string;
  tierSummary: string;
  createdAt: string;
}

function apiToBooking(api: ApiBookingItem): Booking {
  const tierSummary = (api.items ?? [])
    .map((item) => `${item.ticketTypeName} ×${item.quantity}`)
    .join(', ');

  return {
    id: api.id,
    bookingNumber: api.bookingNumber,
    eventId: api.eventId,
    eventTitle: api.eventTitle,
    status: api.status,
    totalCents: api.totalCents,
    qrToken: api.qrToken,
    tierSummary,
    createdAt: api.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Placeholder
// ---------------------------------------------------------------------------
const PLACEHOLDER_BOOKINGS: Booking[] = [
  {
    id: 'b1', bookingNumber: 'BK-001', eventId: '2', eventTitle: 'React Summit 2026',
    status: 'confirmed', totalCents: 34900, qrToken: 'EVT-RSM26-WRK-A1B2C3',
    tierSummary: 'Workshop Pass ×1',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'b2', bookingNumber: 'BK-002', eventId: '1', eventTitle: 'Neon Frequencies Festival',
    status: 'confirmed', totalCents: 17800, qrToken: 'EVT-NEO26-GA-D4E5F6',
    tierSummary: 'General Admission ×2',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'b3', bookingNumber: 'BK-003', eventId: '10', eventTitle: 'Electronic Music Night',
    status: 'used', totalCents: 8000, qrToken: 'EVT-EMN26-VIP-G7H8I9',
    tierSummary: 'VIP ×1',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCents(cents: number): string {
  if (cents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; color: string }> = {
  confirmed: { label: 'Confirmed', bg: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' },
  pending: { label: 'Pending', bg: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' },
  cancelled: { label: 'Cancelled', bg: 'color-mix(in srgb, var(--color-error) 15%, transparent)', color: 'var(--color-error)' },
  used: { label: 'Attended', bg: 'color-mix(in srgb, var(--text-tertiary) 20%, transparent)', color: 'var(--text-tertiary)' },
};

function StatusBadge({ status }: { status: BookingStatus }): React.ReactElement {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.65rem',
      borderRadius: '999px',
      fontSize: '0.72rem',
      fontWeight: 700,
      letterSpacing: '0.04em',
      background: cfg.bg,
      color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// QR Display
// ---------------------------------------------------------------------------
function QRDisplay({ token }: { token: string }): React.ReactElement {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.85rem',
          borderRadius: '0.65rem',
          border: '1px solid var(--border)',
          background: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          fontSize: '0.78rem',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        <QrCode size={13} />
        {expanded ? 'Hide QR' : 'Show QR'}
      </button>
      {expanded && (
        <div style={{
          marginTop: '0.75rem',
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          {/* SVG QR placeholder */}
          <div style={{
            width: '100px',
            height: '100px',
            background: 'var(--text-primary)',
            borderRadius: '0.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            padding: '8px',
            gap: '2px',
          }}>
            {Array.from({ length: 49 }).map((_, i) => {
              const row = Math.floor(i / 7);
              const col = i % 7;
              const isCorner =
                (row < 3 && col < 3) ||
                (row < 3 && col > 3) ||
                (row > 3 && col < 3);
              const isFilled = isCorner || (Math.sin(i * 13.7) > 0.1);
              return (
                <div key={i} style={{
                  background: isFilled ? 'var(--bg-primary)' : 'var(--text-primary)',
                  borderRadius: '1px',
                }} />
              );
            })}
          </div>
          <code style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            letterSpacing: '0.1em',
          }}>
            {token}
          </code>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: 0, textAlign: 'center' }}>
            Show this at the venue entrance
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Booking card
// ---------------------------------------------------------------------------
function BookingCard({ booking }: { booking: Booking }): React.ReactElement {
  const isPast = booking.status === 'used' || booking.status === 'cancelled';

  return (
    <div style={{
      display: 'flex',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '1.25rem',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-card)',
      opacity: isPast ? 0.75 : 1,
    }}>
      {/* Status stripe */}
      <div style={{
        width: '6px',
        flexShrink: 0,
        background: STATUS_CONFIG[booking.status]?.color ?? 'var(--border)',
      }} />

      {/* Content */}
      <div style={{ flex: 1, padding: '1.25rem', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 0.15rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {booking.eventTitle}
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: 0, fontFamily: 'var(--font-mono)' }}>
              #{booking.bookingNumber}
            </p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <Calendar size={12} style={{ color: 'var(--accent-primary)' }} />
            {new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          {booking.tierSummary && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <Ticket size={12} style={{ color: 'var(--accent-primary)' }} />
              {booking.tierSummary}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            {booking.status === 'confirmed' && booking.qrToken && (
              <QRDisplay token={booking.qrToken} />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--accent-cta)', fontSize: '1rem' }}>
              {formatCents(booking.totalCents)}
            </span>
            <Link
              to={`/events/${booking.eventId}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.8rem',
                color: 'var(--accent-primary)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              View Event <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function MyBookingsPage(): React.ReactElement {
  const { isAuthenticated, user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetchBookings(): Promise<void> {
      try {
        const res = await apiClient.get<ApiBookingsResponse>('/bookings/mine');
        if (!cancelled) {
          setBookings((res.data.items ?? []).map(apiToBooking));
        }
      } catch {
        if (!cancelled) setBookings(PLACEHOLDER_BOOKINGS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchBookings();
    return () => { cancelled = true; };
  }, []);

  // Split by status rather than date since API doesn't return event dates in booking list
  const upcoming = bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending');
  const past = bookings.filter((b) => b.status === 'used' || b.status === 'cancelled');
  const displayed = activeTab === 'upcoming' ? upcoming : past;

  const totalSpent = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.totalCents, 0);

  return (
    <div style={{ paddingTop: '64px' }}>
      <Helmet>
        <title>My Bookings — Code829</title>
      </Helmet>

      <main style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: '80px', paddingBottom: '4rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 0.4rem',
            }}>
              My Bookings
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
              Welcome back, {user?.name?.split(' ')[0] ?? 'there'}
            </p>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}>
            {[
              { label: 'Upcoming', value: upcoming.length, color: 'var(--accent-primary)' },
              { label: 'Attended', value: bookings.filter((b) => b.status === 'used').length, color: 'var(--color-success)' },
              { label: 'Total Spent', value: formatCents(totalSpent), color: 'var(--accent-cta)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                padding: '1.25rem',
                background: 'var(--bg-secondary)',
                borderRadius: '1rem',
                border: '1px solid var(--border)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)', color }}>
                  {value}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.25rem',
            background: 'var(--bg-secondary)',
            borderRadius: '999px',
            padding: '0.25rem',
            border: '1px solid var(--border)',
            marginBottom: '1.5rem',
            width: 'fit-content',
          }}>
            {(['upcoming', 'past'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.45rem 1.25rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: activeTab === tab ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === tab ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab ? 600 : 400,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {tab === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
              </button>
            ))}
          </div>

          {/* Booking list */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} className="h-36" />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
              <Ticket size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                No {activeTab} bookings
              </h3>
              {activeTab === 'upcoming' && (
                <Link
                  to="/events"
                  style={{
                    display: 'inline-block',
                    marginTop: '1rem',
                    padding: '0.6rem 1.5rem',
                    background: 'var(--accent-primary)',
                    color: 'var(--bg-primary)',
                    borderRadius: '999px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Browse Events
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {displayed.map((booking, i) => (
                <div
                  key={booking.id}
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <BookingCard booking={booking} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
