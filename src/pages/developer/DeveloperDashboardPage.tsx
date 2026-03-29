import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, MapPin, Ticket, DollarSign, Clock, Users,
  TrendingUp, ArrowRight, CheckCircle2, XCircle, AlertCircle,
  BarChart3, Zap, Eye
} from 'lucide-react';
import apiClient from '../../lib/axios';
import { SkeletonLine } from '../../components/Skeleton';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TicketTypeSummary {
  id: string;
  name: string;
  priceCents: number;
  quantityTotal: number;
  quantitySold: number;
}

interface RecentBooking {
  id: string;
  bookingNumber: string;
  userName: string;
  userEmail: string;
  status: string;
  totalCents: number;
  createdAt: string;
}

interface NextEventData {
  eventId: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  startDate: string;
  endDate: string;
  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  imagePath: string | null;
  layoutMode: string;
  daysUntil: number;
  totalBookings: number;
  paidBookings: number;
  checkedInBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  refundedBookings: number;
  revenueCents: number;
  potentialRevenueCents: number;
  totalCapacity: number;
  soldCount: number;
  ticketTypes: TicketTypeSummary[];
  recentBookings: RecentBooking[];
}

interface ApiResponse {
  hasUpcoming: boolean;
  data?: NextEventData;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ComponentType<{ size: number }> }> = {
  Paid: { color: 'var(--color-success)', bg: 'color-mix(in srgb, var(--color-success) 12%, transparent)', icon: CheckCircle2 },
  CheckedIn: { color: 'var(--accent-primary)', bg: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)', icon: CheckCircle2 },
  Pending: { color: 'var(--color-warning)', bg: 'color-mix(in srgb, var(--color-warning) 12%, transparent)', icon: AlertCircle },
  Cancelled: { color: 'var(--color-error)', bg: 'color-mix(in srgb, var(--color-error) 12%, transparent)', icon: XCircle },
  Refunded: { color: 'var(--text-tertiary)', bg: 'color-mix(in srgb, var(--text-tertiary) 12%, transparent)', icon: XCircle },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function CountdownBlock({ value, label }: { value: number; label: string }): React.ReactElement {
  return (
    <div style={{ textAlign: 'center', minWidth: '56px' }}>
      <div style={{
        fontSize: '2rem', fontWeight: 800, lineHeight: 1,
        fontFamily: 'var(--font-display)', color: 'var(--text-primary)',
      }}>{value}</div>
      <div style={{
        fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginTop: '0.25rem',
      }}>{label}</div>
    </div>
  );
}

function ProgressBar({ value, max, color, height = 8 }: {
  value: number; max: number; color: string; height?: number;
}): React.ReactElement {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{
      width: '100%', height: `${height}px`, borderRadius: '999px',
      background: 'var(--bg-tertiary)', overflow: 'hidden',
    }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: '999px', background: color,
        transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }} />
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ size: number }>; label: string;
  value: string | number; sub?: string; color: string;
}): React.ReactElement {
  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: '0.75rem', padding: '1.25rem',
      display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{
        width: '42px', height: '42px', borderRadius: '0.625rem',
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, flexShrink: 0,
      }}>
        <Icon size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: 'var(--text-tertiary)',
        }}>{label}</div>
        <div style={{
          fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)',
          color: 'var(--text-primary)', lineHeight: 1.2, marginTop: '0.2rem',
        }}>{value}</div>
        {sub && <div style={{
          fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem',
        }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function DashboardSkeleton(): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Hero skeleton */}
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: '1rem',
        border: '1px solid var(--border)', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', gap: '2rem', padding: '2rem' }}>
          <div style={{ flex: 1 }}>
            <SkeletonLine className="w-24 h-5" />
            <SkeletonLine className="w-4/5 h-10 mt-3" />
            <SkeletonLine className="w-3/5 h-5 mt-3" />
            <SkeletonLine className="w-2/5 h-5 mt-2" />
            <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
              <SkeletonLine className="w-16 h-12" />
              <SkeletonLine className="w-16 h-12" />
              <SkeletonLine className="w-16 h-12" />
            </div>
          </div>
        </div>
      </div>
      {/* Metrics skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            background: 'var(--bg-secondary)', borderRadius: '0.75rem',
            border: '1px solid var(--border)', padding: '1.25rem',
          }}>
            <SkeletonLine className="w-20 h-4" />
            <SkeletonLine className="w-16 h-8 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function NoUpcomingEvents(): React.ReactElement {
  const navigate = useNavigate();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '50vh', textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.5rem',
      }}>
        <CalendarDays size={36} style={{ color: 'var(--accent-primary)' }} />
      </div>
      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: '1.5rem',
        fontWeight: 700, color: 'var(--text-primary)', margin: 0,
      }}>No Upcoming Events</h2>
      <p style={{
        color: 'var(--text-secondary)', maxWidth: '400px',
        marginTop: '0.5rem', fontSize: '0.9375rem', lineHeight: 1.5,
      }}>
        Create and publish an event to see your dashboard come to life with
        real-time booking data, revenue tracking, and attendee insights.
      </p>
      <button
        onClick={() => navigate('/developer/events')}
        style={{
          marginTop: '1.5rem', padding: '0.75rem 1.5rem',
          background: 'var(--accent-primary)', color: '#fff',
          border: 'none', borderRadius: '0.5rem', fontWeight: 600,
          fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'var(--font-body)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}
      >
        View Events <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function DeveloperDashboardPage(): React.ReactElement {
  const [data, setData] = useState<NextEventData | null>(null);
  const [hasUpcoming, setHasUpcoming] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function fetch(): Promise<void> {
      try {
        const res = await apiClient.get<ApiResponse>('/developer/dashboard/next-event');
        if (cancelled) return;
        if (res.data.hasUpcoming && res.data.data) {
          setData(res.data.data);
        } else {
          setHasUpcoming(false);
        }
      } catch {
        setHasUpcoming(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetch();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!hasUpcoming || !data) return <NoUpcomingEvents />;

  const d = data;
  const daysUntil = d.daysUntil;
  const hours = Math.floor((new Date(d.startDate).getTime() - Date.now()) / 3600000) % 24;
  const capacityPct = d.totalCapacity > 0 ? Math.round((d.soldCount / d.totalCapacity) * 100) : 0;
  const revenuePct = d.potentialRevenueCents > 0
    ? Math.round((d.revenueCents / d.potentialRevenueCents) * 100) : 0;

  const bookingSegments = [
    { key: 'Paid', count: d.paidBookings, color: 'var(--color-success)' },
    { key: 'CheckedIn', count: d.checkedInBookings, color: 'var(--accent-primary)' },
    { key: 'Pending', count: d.pendingBookings, color: 'var(--color-warning)' },
    { key: 'Cancelled', count: d.cancelledBookings, color: 'var(--color-error)' },
    { key: 'Refunded', count: d.refundedBookings, color: 'var(--text-tertiary)' },
  ].filter(s => s.count > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ───── Hero Section ───── */}
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: '1rem',
        border: '1px solid var(--border)', overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ display: 'flex', minHeight: '220px' }}>
          {/* Event Info */}
          <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{
                padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.6875rem',
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                background: 'color-mix(in srgb, var(--accent-primary) 14%, transparent)',
                color: 'var(--accent-primary)',
              }}>Next Up</span>
              <span style={{
                padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.6875rem',
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                background: 'color-mix(in srgb, var(--color-info) 12%, transparent)',
                color: 'var(--color-info)',
              }}>{d.category}</span>
              <span style={{
                padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.6875rem',
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                background: d.status === 'Published'
                  ? 'color-mix(in srgb, var(--color-success) 12%, transparent)'
                  : 'color-mix(in srgb, var(--color-warning) 12%, transparent)',
                color: d.status === 'Published' ? 'var(--color-success)' : 'var(--color-warning)',
              }}>{d.status}</span>
            </div>

            <h1
              onClick={() => navigate(`/developer/events/${d.eventId}`)}
              style={{
                fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800,
                color: 'var(--text-primary)', margin: 0, lineHeight: 1.15,
                cursor: 'pointer',
              }}
            >{d.title}</h1>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: '0.35rem',
              marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarDays size={15} />
                <span>{formatDate(d.startDate)} &middot; {formatTime(d.startDate)} – {formatTime(d.endDate)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={15} />
                <span>{d.venueName} &middot; {d.venueCity}, {d.venueState}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1.25rem' }}>
              <button
                onClick={() => navigate(`/developer/events/${d.eventId}`)}
                style={{
                  padding: '0.5rem 1rem', background: 'var(--accent-primary)',
                  color: '#fff', border: 'none', borderRadius: '0.5rem',
                  fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >Manage Event <ArrowRight size={14} /></button>
              <button
                onClick={() => navigate(`/developer/events/${d.eventId}?tab=bookings`)}
                style={{
                  padding: '0.5rem 1rem', background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', border: '1px solid var(--border)',
                  borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.8125rem',
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              ><Ticket size={14} /> Bookings</button>
              <button
                onClick={() => navigate(`/events/${d.slug}`)}
                style={{
                  padding: '0.5rem 1rem', background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', border: '1px solid var(--border)',
                  borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.8125rem',
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              ><Eye size={14} /> Public Page</button>
            </div>
          </div>

          {/* Countdown */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '2rem 2.5rem',
            borderLeft: '1px solid var(--border)',
            background: 'color-mix(in srgb, var(--accent-primary) 3%, transparent)',
            minWidth: '220px',
          }}>
            <div style={{
              fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: '1rem',
            }}>
              <Clock size={12} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
              Starts In
            </div>
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <CountdownBlock value={daysUntil} label="days" />
              <CountdownBlock value={Math.max(0, hours)} label="hours" />
            </div>
            {daysUntil <= 7 && (
              <div style={{
                marginTop: '1rem', padding: '0.3rem 0.75rem', borderRadius: '999px',
                background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
                color: 'var(--color-warning)', fontSize: '0.75rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}>
                <Zap size={12} /> Coming Soon
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───── Key Metrics Row ───── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        <MetricCard
          icon={Ticket} label="Tickets Sold" color="var(--accent-primary)"
          value={d.soldCount} sub={d.totalCapacity > 0 ? `of ${d.totalCapacity} (${capacityPct}%)` : undefined}
        />
        <MetricCard
          icon={DollarSign} label="Revenue" color="var(--color-success)"
          value={formatCurrency(d.revenueCents)}
          sub={d.potentialRevenueCents > 0 ? `${revenuePct}% of ${formatCurrency(d.potentialRevenueCents)}` : undefined}
        />
        <MetricCard
          icon={Users} label="Bookings" color="var(--color-info)"
          value={d.totalBookings}
          sub={d.paidBookings > 0 ? `${d.paidBookings} confirmed` : 'No bookings yet'}
        />
        <MetricCard
          icon={CheckCircle2} label="Checked In" color="var(--accent-secondary)"
          value={d.checkedInBookings}
          sub={d.totalBookings > 0
            ? `${Math.round((d.checkedInBookings / d.totalBookings) * 100)}% of bookings`
            : 'Event not started'}
        />
      </div>

      {/* ───── Revenue & Capacity Progress ───── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Revenue progress */}
        <div style={{
          background: 'var(--bg-secondary)', borderRadius: '0.75rem',
          border: '1px solid var(--border)', padding: '1.25rem',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} style={{ color: 'var(--color-success)' }} />
              <span style={{
                fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)',
              }}>Revenue Progress</span>
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-success)' }}>
              {revenuePct}%
            </span>
          </div>
          <ProgressBar value={d.revenueCents} max={d.potentialRevenueCents} color="var(--color-success)" />
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem',
            fontSize: '0.75rem', color: 'var(--text-tertiary)',
          }}>
            <span>{formatCurrency(d.revenueCents)} earned</span>
            <span>{formatCurrency(d.potentialRevenueCents)} potential</span>
          </div>
        </div>

        {/* Capacity progress */}
        <div style={{
          background: 'var(--bg-secondary)', borderRadius: '0.75rem',
          border: '1px solid var(--border)', padding: '1.25rem',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} style={{ color: 'var(--accent-primary)' }} />
              <span style={{
                fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)',
              }}>Capacity Filled</span>
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
              {capacityPct}%
            </span>
          </div>
          <ProgressBar value={d.soldCount} max={d.totalCapacity} color="var(--accent-primary)" />
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem',
            fontSize: '0.75rem', color: 'var(--text-tertiary)',
          }}>
            <span>{d.soldCount} sold</span>
            <span>{d.totalCapacity} total capacity</span>
          </div>
        </div>
      </div>

      {/* ───── Booking Breakdown & Ticket Types ───── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Booking status breakdown */}
        <div style={{
          background: 'var(--bg-secondary)', borderRadius: '0.75rem',
          border: '1px solid var(--border)', padding: '1.25rem',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem',
          }}>
            <BarChart3 size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{
              fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)',
            }}>Booking Breakdown</span>
          </div>

          {d.totalBookings === 0 ? (
            <div style={{
              textAlign: 'center', padding: '1.5rem 0',
              color: 'var(--text-tertiary)', fontSize: '0.8125rem',
            }}>No bookings yet</div>
          ) : (
            <>
              {/* Stacked bar */}
              <div style={{
                display: 'flex', height: '12px', borderRadius: '999px',
                overflow: 'hidden', background: 'var(--bg-tertiary)', marginBottom: '1rem',
              }}>
                {bookingSegments.map(s => (
                  <div key={s.key} style={{
                    width: `${(s.count / d.totalBookings) * 100}%`,
                    background: s.color, transition: 'width 0.6s ease',
                  }} />
                ))}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {bookingSegments.map(s => (
                  <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '10px', height: '10px', borderRadius: '3px', background: s.color,
                      }} />
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{s.key}</span>
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {s.count} ({Math.round((s.count / d.totalBookings) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Ticket types */}
        <div style={{
          background: 'var(--bg-secondary)', borderRadius: '0.75rem',
          border: '1px solid var(--border)', padding: '1.25rem',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem',
          }}>
            <Ticket size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{
              fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)',
            }}>Ticket Types</span>
          </div>

          {d.ticketTypes.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '1.5rem 0',
              color: 'var(--text-tertiary)', fontSize: '0.8125rem',
            }}>
              {d.layoutMode === 'Grid' ? 'Using assigned seating (grid layout)' : 'No ticket types configured'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {d.ticketTypes.map(tt => {
                return (
                  <div key={tt.id}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem',
                    }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {tt.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {tt.quantitySold}/{tt.quantityTotal} &middot; {formatCurrency(tt.priceCents)}
                      </span>
                    </div>
                    <ProgressBar value={tt.quantitySold} max={tt.quantityTotal} color="var(--accent-primary)" height={6} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ───── Recent Bookings ───── */}
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: '0.75rem',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Recent Bookings
            </span>
          </div>
          {d.totalBookings > 0 && (
            <button
              onClick={() => navigate(`/developer/events/${d.eventId}?tab=bookings`)}
              style={{
                background: 'none', border: 'none', color: 'var(--accent-primary)',
                fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}
            >View All <ArrowRight size={13} /></button>
          )}
        </div>

        {d.recentBookings.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '2rem',
            color: 'var(--text-tertiary)', fontSize: '0.8125rem',
          }}>No bookings yet — share the event to start selling!</div>
        ) : (
          <div>
            {d.recentBookings.map((b, i) => {
              const sc = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.Pending;
              const StatusIcon = sc.icon;
              return (
                <div
                  key={b.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '0.75rem 1.25rem',
                    borderBottom: i < d.recentBookings.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {/* Status icon */}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: sc.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                  }}>
                    <StatusIcon size={15} />
                  </div>

                  {/* Name & booking # */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{b.userName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      #{b.bookingNumber}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span style={{
                    padding: '0.2rem 0.5rem', borderRadius: '999px',
                    fontSize: '0.6875rem', fontWeight: 600,
                    background: sc.bg, color: sc.color,
                  }}>{b.status}</span>

                  {/* Amount */}
                  <span style={{
                    fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)',
                    minWidth: '60px', textAlign: 'right',
                  }}>{formatCurrency(b.totalCents)}</span>

                  {/* Time */}
                  <span style={{
                    fontSize: '0.75rem', color: 'var(--text-tertiary)',
                    minWidth: '50px', textAlign: 'right',
                  }}>{timeAgo(b.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

