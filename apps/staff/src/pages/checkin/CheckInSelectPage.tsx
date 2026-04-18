import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarOutlined, EnvironmentOutlined, ScanOutlined } from '@ant-design/icons';
import { checkInApi, eventsApi } from '../../services/api';
import { formatEventDate } from '@code829/shared/utils/date';
import type { EventSummary } from '@code829/shared/types/event';
import type { CheckInStats } from '@code829/shared/types/checkin';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import PulseIndicator from '@code829/shared/components/shared/PulseIndicator';
import {
  FilterBar,
  LoadingBoundary,
  PageShell,
} from '@code829/shared/components/ui';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Staff/CheckInSelectPage');

export default function CheckInSelectPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, CheckInStats>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await eventsApi.list({ page: 1, pageSize: 50, search: search || undefined });
        setEvents(data.items);
        const statsResults = await Promise.allSettled(data.items.map((ev) => checkInApi.getStats(ev.id)));
        const map: Record<string, CheckInStats> = {};
        statsResults.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            map[data.items[i].id] = result.value.data;
          }
        });
        setStatsMap(map);
        log.info('Events and stats loaded', { eventCount: data.items.length, statsCount: Object.keys(map).length });
      } catch (err) {
        log.error('Failed to load events', err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [search]);

  return (
    <PageShell
      title="Staff Check-In"
      documentTitle="Select Event - Code829 Staff"
      subtitle={[
        'Select an event to start welcoming your guests.',
        'Prepare for a smooth entry experience.',
        'Track check-in progress and manage guest flow.',
      ]}
      rotateSubtitle
    >
      <FilterBar
        search={{
          placeholder: 'Search events by title or venue...',
          value: search,
          onChange: (v) => setSearch(v ?? ''),
        }}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
            <PulseIndicator status="calm" size={6} />
            <span>{loading ? 'Refreshing...' : 'Live System'}</span>
          </div>
        }
      />
      <LoadingBoundary
        loading={loading}
        data={events}
        skeleton="card"
        empty={{
          title: 'No events found',
          description: "We couldn't find any published events matching your search. Ensure events are published in Admin mode.",
          actionLabel: 'Clear Search',
          onAction: () => setSearch(''),
        }}
      >
        {(items) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
            {items.map((ev) => {
              const s = statsMap[ev.id];
              const now = new Date();
              const start = new Date(ev.startDate);
              const isSoon = start.getTime() - now.getTime() < 1000 * 60 * 60 * 4;

              return (
                <HumanCard
                  key={ev.id}
                  className="human-noise"
                  onClick={() => navigate(`/checkin/${ev.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        {isSoon && <PulseIndicator status="success" size={6} />}
                        <h3
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            margin: 0,
                            color: 'var(--text-primary)',
                            fontFamily: "'Playfair Display', serif",
                          }}
                        >
                          {ev.title}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 16px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 20 }}>
                        <span>
                          <CalendarOutlined style={{ marginRight: 6, color: 'var(--accent-gold)' }} />
                          {formatEventDate(ev.startDate)}
                        </span>
                        <span>
                          <EnvironmentOutlined style={{ marginRight: 6, color: 'var(--primary)' }} />
                          {ev.venueName || ev.venue?.name || 'Virtual'}
                        </span>
                      </div>

                      {s && (
                        <div
                          style={{
                            display: 'flex',
                            gap: 12,
                            flexWrap: 'wrap',
                            background: 'var(--bg-soft)',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Sold
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{s.totalTicketsSold}</div>
                          </div>
                          <div style={{ width: 1, height: 24, background: 'var(--border)', margin: 'auto 0' }} />
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Checked In
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-green)' }}>{s.checkedIn}</div>
                          </div>
                          <div style={{ width: 1, height: 24, background: 'var(--border)', margin: 'auto 0' }} />
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Remaining
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-gold)' }}>{s.remaining}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--primary-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        boxShadow: 'var(--shadow-sm)',
                        marginLeft: 16,
                      }}
                    >
                      <ScanOutlined style={{ fontSize: 20 }} />
                    </div>
                  </div>
                </HumanCard>
              );
            })}
          </div>
        )}
      </LoadingBoundary>
    </PageShell>
  );
}
