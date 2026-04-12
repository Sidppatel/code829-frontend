import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Input } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, ScanOutlined, SearchOutlined } from '@ant-design/icons';
import { eventsApi } from '../../../services/eventsApi';
import { checkInApi } from '../../../services/api';
import { formatEventDate } from '../../../utils/date';
import type { EventSummary } from '../../../types/event';
import type { CheckInStats } from '../../../types/checkin';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import EmptyState from '../../../components/shared/EmptyState';
import HumanCard from '../../../components/shared/HumanCard';
import PulseIndicator from '../../../components/shared/PulseIndicator';

export default function CheckInSelectPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, CheckInStats>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { message } = App.useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await eventsApi.list({ page: 1, pageSize: 50, search: search || undefined });
        setEvents(data.items);

        // Fetch check-in stats for each event
        const statsResults = await Promise.allSettled(
          data.items.map((ev) => checkInApi.getStats(ev.id))
        );
        const map: Record<string, CheckInStats> = {};
        statsResults.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            map[data.items[i].id] = result.value.data;
          }
        });
        setStatsMap(map);
      } catch {
        message.error('Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [message, search]);

  return (
    <div className="spring-up">
      <PageHeader 
        title="Staff Check-In" 
        subtitle={[
          "Select an event to start welcoming your guests.",
          "Prepare for a smooth entry experience.",
          "Track check-in progress and manage guest flow."
        ]}
        rotateSubtitle
      />

      <div style={{
        display: 'flex', 
        gap: 16, 
        marginBottom: 32, 
        flexWrap: 'wrap', 
        alignItems: 'center',
        padding: '24px',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <Input
          placeholder="Search events by title or venue..."
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          allowClear
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 260, height: 44, borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', paddingLeft: 16 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
          <PulseIndicator status="calm" size={6} />
          <span>{loading ? 'Refreshing...' : 'Live System'}</span>
        </div>
      </div>

      {loading && events.length === 0 ? (
        <LoadingSpinner skeleton="card" />
      ) : events.length === 0 ? (
        <EmptyState
          title="No events found"
          description="We couldn't find any published events matching your search. Ensure events are published in Admin mode."
          actionLabel="Clear Search"
          onAction={() => setSearch('')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
          {events.map((ev) => {
            const s = statsMap[ev.id];
            // Simple heuristic for "happening now" pulse
            const now = new Date();
            const start = new Date(ev.startDate);
            const isSoon = start.getTime() - now.getTime() < 1000 * 60 * 60 * 4; // 4 hours

            return (
              <HumanCard
                key={ev.id}
                className="human-noise"
                onClick={() => navigate(`/staff/checkin/${ev.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      {isSoon && <PulseIndicator status="success" size={6} />}
                      <h3 style={{ 
                        fontSize: 18, 
                        fontWeight: 700, 
                        margin: 0, 
                        color: 'var(--text-primary)',
                        fontFamily: "'Playfair Display', serif",
                      }}>
                        {ev.title}
                      </h3>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 16px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 20 }}>
                      <span><CalendarOutlined style={{ marginRight: 6, color: 'var(--accent-gold)' }} />{formatEventDate(ev.startDate)}</span>
                      <span><EnvironmentOutlined style={{ marginRight: 6, color: 'var(--primary)' }} />{ev.venueName || ev.venue?.name || 'Virtual'}</span>
                    </div>

                    {s && (
                      <div style={{ 
                        display: 'flex', 
                        gap: 12, 
                        flexWrap: 'wrap', 
                        background: 'var(--bg-soft)', 
                        padding: '12px 16px', 
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)' 
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sold</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{s.totalTicketsSold}</div>
                        </div>
                        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: 'auto 0' }} />
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Checked In</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-green)' }}>{s.checkedIn}</div>
                        </div>
                        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: 'auto 0' }} />
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remaining</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-gold)' }}>{s.remaining}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 'var(--radius-full)', 
                    background: 'var(--primary-soft)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    boxShadow: 'var(--shadow-sm)',
                    marginLeft: 16
                  }}>
                    <ScanOutlined style={{ fontSize: 20 }} />
                  </div>
                </div>
              </HumanCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
