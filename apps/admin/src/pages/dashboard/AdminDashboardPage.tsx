import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Button, App } from 'antd';
import { Helmet } from 'react-helmet-async';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminDashboardApi } from '../../services/api';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import { useAuth } from '@code829/shared/hooks/useAuth';
import { formatEventDate } from '@code829/shared/utils/date';
import { centsToUSD } from '@code829/shared/utils/currency';
import type { DashboardStats, NextEventDashboard } from '@code829/shared/types/developer';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import EmptyState from '@code829/shared/components/shared/EmptyState';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Admin/DashboardPage');

type NextEventVars = CSSProperties & { '--c829-sold': number; '--c829-cap': number };

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function Kpi({ label, value, trend }: { label: string; value: string; trend?: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: 1,
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      {trend && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--status-success)',
            marginTop: 8,
            fontWeight: 600,
          }}
        >
          {trend}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        padding: 14,
        background: 'var(--bg-soft)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginTop: 4,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [nextEvent, setNextEvent] = useState<NextEventDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const now = new Date();
  const greeting = greetingForHour(now.getHours());
  const today = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const firstName = user?.firstName || 'there';

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, nextRes] = await Promise.all([
          adminDashboardApi.getStats(),
          adminDashboardApi.getNextEvent(),
        ]);
        setStats(statsRes.data);
        if (nextRes.data.hasUpcoming && nextRes.data.data) {
          setNextEvent(nextRes.data.data);
        }
        log.info('Dashboard loaded', { hasUpcoming: nextRes.data.hasUpcoming });
      } catch (err) {
        log.error('Failed to load dashboard data', err);
        message.error('Failed to load your space');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [message]);

  if (loading) return <LoadingSpinner skeleton="hero" />;

  const progressVars: NextEventVars | undefined = nextEvent
    ? {
        '--c829-sold': nextEvent.soldCount || 0,
        '--c829-cap': nextEvent.totalCapacity || 1,
      }
    : undefined;

  return (
    <div style={{ padding: isMobile ? 20 : '32px 40px' }}>
      <Helmet><title>Dashboard — Code829 Admin</title></Helmet>

      {/* Greeting header */}
      <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>{today}</div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: isMobile ? 28 : 38,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {greeting}, {firstName}.
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/events/new')}
          style={{
            borderRadius: 'var(--radius-md)',
            height: 44,
            padding: '0 22px',
            fontWeight: 600,
            background: 'var(--primary)',
            border: 'none',
            boxShadow: '0 6px 20px rgba(244, 109, 178, 0.30)',
          }}
        >
          Create event
        </Button>
      </div>

      {/* KPI row */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: 14,
            marginBottom: 28,
          }}
        >
          <Kpi label="Revenue (30d)" value={centsToUSD(stats.totalRevenueCents)} />
          <Kpi label="Tickets sold" value={stats.totalBookings.toLocaleString()} />
          <Kpi label="Events live" value={String(stats.upcomingEvents)} />
          <Kpi label="Active users" value={stats.totalUsers.toLocaleString()} />
        </div>
      )}

      {/* Next event + activity */}
      {nextEvent ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.6fr) minmax(0, 1fr)',
            gap: 20,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: isMobile ? 20 : 28,
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
            }}
            onClick={() => navigate(`/events/${nextEvent.slug}`)}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--primary)',
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                Next event · in {nextEvent.daysUntil} days
              </div>
              <span className="status-pill status-published">
                <span className="status-pill-dot" /> Published
              </span>
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: isMobile ? 24 : 30,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
              }}
            >
              {nextEvent.title}
            </div>
            <div
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                marginTop: 4,
                marginBottom: 18,
              }}
            >
              {formatEventDate(nextEvent.startDate)} · {nextEvent.venueName || 'Virtual'}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginBottom: 18,
              }}
            >
              <MiniStat
                label="Sold"
                value={`${nextEvent.soldCount} / ${nextEvent.totalCapacity}`}
              />
              <MiniStat label="Revenue" value={centsToUSD(nextEvent.revenueCents)} />
              <MiniStat label="Checked in" value={nextEvent.checkedInBookings} />
            </div>

            <div
              style={progressVars}
            >
              <div
                style={{
                  height: 8,
                  background: 'var(--bg-muted)',
                  borderRadius: 99,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: 'calc(var(--c829-sold) / var(--c829-cap) * 100%)',
                    height: '100%',
                    background: 'var(--gradient-brand)',
                    transition: 'width 0.5s var(--ease-human)',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 18,
                flexWrap: 'wrap',
              }}
            >
              <Button
                type="primary"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/events/${nextEvent.slug}`);
                }}
                style={{
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary)',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                Manage event
              </Button>
              <Button
                type="text"
                size="small"
                style={{ color: 'var(--text-secondary)', fontWeight: 600 }}
                onClick={(e) => e.stopPropagation()}
              >
                Export guest list
              </Button>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: isMobile ? 20 : 24,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 12,
              }}
            >
              At a glance
            </div>
            <ActivityRow label="Paid bookings" value={nextEvent.paidBookings} />
            <ActivityRow label="Pending" value={nextEvent.pendingBookings} />
            <ActivityRow label="Cancelled" value={nextEvent.cancelledBookings} />
            <ActivityRow label="Refunded" value={nextEvent.refundedBookings} />
            <ActivityRow
              label="Projected"
              value={centsToUSD(nextEvent.potentialRevenueCents)}
              last
            />
          </div>
        </div>
      ) : (
        <EmptyState
          title="No upcoming events"
          description="Publish your next event and it will appear here with live bookings and revenue."
          actionLabel="Create event"
          onAction={() => navigate('/events/new')}
        />
      )}
    </div>
  );
}

function ActivityRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string | number;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
        fontSize: 13,
      }}
    >
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}
