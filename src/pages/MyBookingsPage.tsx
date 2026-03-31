import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar, QrCode, ChevronRight, Ticket, Send, User, ChevronDown, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { SkeletonCard } from '../components/Skeleton';
import { bookingsApi } from '../services/bookingsApi';

// ---------------------------------------------------------------------------
// Types matching actual API response
// ---------------------------------------------------------------------------
type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'used' | 'refunded';

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
  seatId: string | null;
  seatLabel: string | null;
  priceCents: number;
  qrToken: string | null;
  guestName: string | null;
  guestEmail: string | null;
  invitationToken: string | null;
  isCheckedIn: boolean;
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
  items: ApiBookingLineItem[];
  createdAt: string;
}

function mapApiStatus(apiStatus: string): BookingStatus {
  switch (apiStatus) {
    case 'Paid': return 'confirmed';
    case 'Pending': return 'pending';
    case 'CheckedIn': return 'used';
    case 'Cancelled': return 'cancelled';
    case 'Refunded': return 'refunded';
    default: return apiStatus.toLowerCase() as BookingStatus;
  }
}

function apiToBooking(api: ApiBookingItem): Booking {
  const names = [...new Set((api.items ?? []).map(i => i.ticketTypeName))];
  const tierSummary = names.map(n => {
    const count = (api.items ?? []).filter(i => i.ticketTypeName === n).length;
    return `${n} ×${count}`;
  }).join(', ');

  return {
    id: api.id,
    bookingNumber: api.bookingNumber,
    eventId: api.eventId,
    eventTitle: api.eventTitle,
    status: mapApiStatus(api.status as string),
    totalCents: api.totalCents,
    qrToken: api.qrToken,
    tierSummary,
    items: api.items ?? [],
    createdAt: api.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Placeholder
// ---------------------------------------------------------------------------
const PLACEHOLDER_BOOKINGS: Booking[] = [];

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
  refunded: { label: 'Refunded', bg: 'color-mix(in srgb, var(--color-error) 10%, transparent)', color: 'var(--text-tertiary)' },
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
// Per-seat ticket with QR code, guest info, and invitation
// ---------------------------------------------------------------------------
function SeatTicket({ item, bookingId, onUpdate }: { item: ApiBookingLineItem; bookingId: string; onUpdate: () => void }): React.ReactElement {
  const [guestName, setGuestName] = useState(item.guestName ?? '');
  const [guestEmail, setGuestEmail] = useState(item.guestEmail ?? '');
  const [sending, setSending] = useState(false);

  async function handleSendInvite(): Promise<void> {
    if (!guestEmail.trim()) { toast.error('Enter a guest email first'); return; }
    setSending(true);
    try {
      await bookingsApi.updateGuest(bookingId, item.id, {
        guestName: guestName || null, guestEmail: guestEmail || null, sendInvitation: true,
      });
      toast.success(`Invitation sent to ${guestEmail}`);
      onUpdate();
    } catch { toast.error('Failed to send invitation'); }
    finally { setSending(false); }
  }

  async function handleSaveGuest(): Promise<void> {
    try {
      await bookingsApi.updateGuest(bookingId, item.id, {
        guestName: guestName || null, guestEmail: guestEmail || null, sendInvitation: false,
      });
      toast.success('Guest info saved');
      onUpdate();
    } catch { toast.error('Failed to save'); }
  }

  return (
    <div style={{
      padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)',
      background: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', gap: '0.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Ticket size={13} aria-hidden="true" style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {item.ticketTypeName}
          </span>
          {item.seatLabel && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0.1rem 0.4rem', background: 'var(--bg-secondary)', borderRadius: '999px' }}>
              Seat {item.seatLabel}
            </span>
          )}
        </div>
        {item.isCheckedIn && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-success)' }}>
            <CheckCircle size={12} aria-hidden="true" /> Checked In
          </span>
        )}
      </div>

      {/* QR Token */}
      {item.qrToken && !item.isCheckedIn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
          <QrCode size={32} style={{ color: 'var(--text-primary)', flexShrink: 0 }} />
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
            {item.qrToken}
          </code>
        </div>
      )}

      {/* Guest info */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input
          placeholder="Guest name (optional)"
          value={guestName}
          onChange={e => setGuestName(e.target.value)}
          onBlur={() => void handleSaveGuest()}
          style={{
            flex: 1, minWidth: '120px', padding: '0.35rem 0.5rem', borderRadius: '0.375rem',
            border: '1px solid var(--border)', background: 'var(--bg-primary)',
            color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none',
          }}
        />
        <input
          placeholder="Guest email (optional)"
          type="email"
          value={guestEmail}
          onChange={e => setGuestEmail(e.target.value)}
          onBlur={() => void handleSaveGuest()}
          style={{
            flex: 1, minWidth: '140px', padding: '0.35rem 0.5rem', borderRadius: '0.375rem',
            border: '1px solid var(--border)', background: 'var(--bg-primary)',
            color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none',
          }}
        />
        <button
          onClick={() => void handleSendInvite()}
          disabled={sending || !guestEmail.trim()}
          title="Send invitation email with QR code link"
          style={{
            padding: '0.35rem 0.6rem', borderRadius: '0.375rem', border: 'none',
            background: guestEmail.trim() ? 'var(--accent-primary)' : 'var(--bg-secondary)',
            color: guestEmail.trim() ? 'var(--bg-primary)' : 'var(--text-tertiary)',
            fontSize: '0.75rem', fontWeight: 600, cursor: sending || !guestEmail.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.25rem',
          }}
        >
          <Send size={11} /> {sending ? '...' : 'Invite'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Booking card
// ---------------------------------------------------------------------------
function BookingCard({ booking, onRefresh }: { booking: Booking; onRefresh: () => void }): React.ReactElement {
  const isPast = booking.status === 'used' || booking.status === 'cancelled' || booking.status === 'refunded';
  const [showTickets, setShowTickets] = useState(false);
  const isConfirmed = booking.status === 'confirmed';

  return (
    <div style={{
      display: 'flex',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '1.25rem',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-card)',
      opacity: isPast ? 0.75 : 1,
      flexDirection: 'column',
    }}>
      <div style={{ display: 'flex' }}>
        {/* Status stripe */}
        <div style={{
          width: '6px',
          flexShrink: 0,
          background: STATUS_CONFIG[booking.status]?.color ?? 'var(--border)',
        }} />

        {/* Content */}
        <div style={{ flex: 1, padding: '1.25rem', minWidth: 0 }}>
          <div className="c829-booking-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700,
                color: 'var(--text-primary)', margin: '0 0 0.15rem',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
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
              <Calendar size={12} aria-hidden="true" style={{ color: 'var(--accent-primary)' }} />
              {new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {booking.tierSummary && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <Ticket size={12} aria-hidden="true" style={{ color: 'var(--accent-primary)' }} />
                {booking.tierSummary}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              {isConfirmed && booking.items.length > 0 && (
                <button
                  onClick={() => setShowTickets(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.4rem 0.85rem', borderRadius: '0.65rem',
                    border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}
                >
                  <QrCode size={13} />
                  {showTickets ? 'Hide' : 'Show'} {booking.items.length} Ticket{booking.items.length > 1 ? 's' : ''}
                  <ChevronDown size={12} style={{ transform: showTickets ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--accent-cta)', fontSize: '1rem' }}>
                {formatCents(booking.totalCents)}
              </span>
              <Link
                to={`/events/${booking.eventId}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.2rem',
                  fontSize: '0.8rem', color: 'var(--accent-primary)',
                  textDecoration: 'none', fontWeight: 500,
                }}
              >
                View Event <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Per-seat tickets with QR codes + guest info */}
      {showTickets && isConfirmed && (
        <div style={{
          borderTop: '1px solid var(--border)', padding: '1rem 1.25rem',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
            <User size={12} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Individual Tickets — assign guests & share QR codes
          </div>
          {booking.items.map(item => (
            <SeatTicket key={item.id} item={item} bookingId={booking.id} onUpdate={onRefresh} />
          ))}
        </div>
      )}
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

  async function refreshBookings(): Promise<void> {
    try {
      const res = await bookingsApi.getMine<ApiBookingsResponse>();
      setBookings((res.data.items ?? []).map(apiToBooking));
    } catch { /* ignore */ }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetchBookings(): Promise<void> {
      try {
        const res = await bookingsApi.getMine<ApiBookingsResponse>();
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
  const past = bookings.filter((b) => b.status === 'used' || b.status === 'cancelled' || b.status === 'refunded');
  const displayed = activeTab === 'upcoming' ? upcoming : past;

  const totalSpent = bookings
    .filter((b) => b.status !== 'cancelled' && b.status !== 'refunded')
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
              Welcome back, {user?.firstName ?? 'there'}
            </p>
          </div>

          {/* Stats */}
          <div className="c829-stat-grid" style={{
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
              <Ticket size={40} aria-hidden="true" style={{ color: 'var(--text-tertiary)', margin: '0 auto 1rem' }} />
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
                  <BookingCard booking={booking} onRefresh={() => void refreshBookings()} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
