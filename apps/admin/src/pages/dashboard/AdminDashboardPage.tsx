import { useCallback } from 'react';
import type { CSSProperties } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminDashboardApi } from '../../services/api';
import { useAuth } from '@code829/shared/hooks/useAuth';
import { useAsyncResource } from '@code829/shared/hooks';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import { formatEventDate } from '@code829/shared/utils/date';
import { centsToUSD } from '@code829/shared/utils/currency';
import type { DashboardStats, NextEventDashboard } from '@code829/shared/types/developer';
import {
  DisplayHeading,
  LoadingBoundary,
  MiniStat,
  PageShell,
  StatsRow,
} from '@code829/shared/components/ui';
import type { StatsCell } from '@code829/shared/components/ui';
import EmptyState from '@code829/shared/components/shared/EmptyState';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Admin/DashboardPage');

type NextEventVars = CSSProperties & { '--c829-sold': number; '--c829-cap': number };

interface DashboardData {
  stats: DashboardStats;
  nextEvent: NextEventDashboard | null;
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const fetchDashboard = useCallback(async (): Promise<DashboardData> => {
    const [statsRes, nextRes] = await Promise.all([
      adminDashboardApi.getStats(),
      adminDashboardApi.getNextEvent(),
    ]);
    const nextEvent = nextRes.data.hasUpcoming && nextRes.data.data ? nextRes.data.data : null;
    log.info('Dashboard loaded', { hasUpcoming: nextRes.data.hasUpcoming });
    return { stats: statsRes.data, nextEvent };
  }, []);
  const { data, loading } = useAsyncResource(fetchDashboard);

  const now = new Date();
  const greeting = greetingForHour(now.getHours());
  const today = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const firstName = user?.firstName || 'there';

  return (
    <PageShell
      title={`${greeting}, ${firstName}.`}
      subtitle={today}
      documentTitle="Dashboard — Code829 Admin"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/events/new')}
          style={{
            borderRadius: 'var(--radius-md)',
            height: isMobile ? 38 : 44,
            padding: isMobile ? '0 16px' : '0 22px',
            fontWeight: 600,
            boxShadow: 'var(--shadow-hover)',
            fontSize: isMobile ? 13 : 14,
          }}
        >
          {isMobile ? 'New event' : 'Create event'}
        </Button>
      }
    >
      <LoadingBoundary loading={loading} data={data} skeleton="hero">
        {({ stats, nextEvent }) => {
          const kpis: StatsCell[] = [
            { label: 'Revenue (30d)', value: centsToUSD(stats.totalRevenueCents) },
            { label: 'Tickets sold', value: stats.totalPurchases.toLocaleString() },
            { label: 'Events live', value: String(stats.publishedEvents) },
            { label: 'Active users', value: stats.totalUsers.toLocaleString() },
          ];

          const progressVars: NextEventVars | undefined = nextEvent
            ? {
              '--c829-sold': nextEvent.soldCount || 0,
              '--c829-cap': nextEvent.totalCapacity || 1,
            }
            : undefined;

          return (
            <>
              <StatsRow
                items={kpis}
                variant="kpi"
                columns={isMobile ? 2 : 4}
                style={{ marginBottom: isMobile ? 16 : 28 }}
              />
              {nextEvent ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: isMobile ? 16 : 20,
                      marginBottom: isMobile ? 16 : 28,
                    }}
                  >
                    <div
                      style={{
                        flex: isMobile ? '1 1 100%' : '1.6 1 0%',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: isMobile ? 20 : 28,
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/events/${nextEvent.eventId}`)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
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
                    <DisplayHeading as="div" size="lg">
                      {nextEvent.title}
                    </DisplayHeading>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 18 }}>
                      {formatEventDate(nextEvent.startDate)} · {nextEvent.venueName || 'Virtual'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
                      <MiniStat label="Sold" value={`${nextEvent.soldCount} / ${nextEvent.totalCapacity}`} />
                      <MiniStat label="Revenue" value={centsToUSD(nextEvent.revenueCents)} />
                      <MiniStat label="Checked in" value={nextEvent.checkedInPurchases} />
                    </div>
                    <div style={progressVars}>
                      <div style={{ height: 8, background: 'var(--bg-muted)', borderRadius: 99, overflow: 'hidden' }}>
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
                    <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                      <Button
                        type="primary"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/events/${nextEvent.eventId}`);
                        }}
                        style={{ borderRadius: 'var(--radius-md)', fontWeight: 600 }}
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
                        flex: isMobile ? '1 1 100%' : '1 1 0%',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 24,
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                    <DisplayHeading as="div" size="sm" style={{ marginBottom: 12 }}>
                      At a glance
                    </DisplayHeading>
                    <ActivityRow label="Paid purchases" value={nextEvent.paidPurchases} />
                    <ActivityRow label="Pending" value={nextEvent.pendingPurchases} />
                    <ActivityRow label="Cancelled" value={nextEvent.cancelledPurchases} />
                    <ActivityRow label="Projected" value={centsToUSD(nextEvent.potentialRevenueCents)} last />
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
            </>
          );
        }}
      </LoadingBoundary>
    </PageShell>
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
