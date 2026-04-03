import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, App, Empty, Skeleton, Input, Tag } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, ScanOutlined, SearchOutlined } from '@ant-design/icons';
import { eventsApi } from '../../../services/eventsApi';
import { checkInApi } from '../../../services/api';
import { formatEventDate } from '../../../utils/date';
import type { EventSummary } from '../../../types/event';
import type { CheckInStats } from '../../../types/checkin';
import PageHeader from '../../../components/shared/PageHeader';

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
    <div>
      <PageHeader title="Staff Check-In" subtitle="Select an event to start scanning tickets" />

      <Input
        placeholder="Search events..."
        prefix={<SearchOutlined />}
        allowClear
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: 300, width: '100%', marginBottom: 16 }}
      />

      {loading ? (
        <>
          {[1, 2, 3].map((i) => (
            <Card key={i} size="small" style={{ marginBottom: 12 }}>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          ))}
        </>
      ) : events.length === 0 ? (
        <Empty description="No published events" />
      ) : (
        events.map((ev) => {
          const s = statsMap[ev.id];
          return (
            <Card
              key={ev.id}
              size="small"
              hoverable
              onClick={() => navigate(`/staff/checkin/${ev.id}`)}
              style={{ marginBottom: 12, cursor: 'pointer' }}
              styles={{ body: { padding: 16 } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                    {ev.title}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 16px', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    <span><CalendarOutlined style={{ marginRight: 4 }} />{formatEventDate(ev.startDate)}</span>
                    <span><EnvironmentOutlined style={{ marginRight: 4 }} />{ev.venueName}, {ev.venueCity}</span>
                  </div>
                  {s && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Tag color="blue" style={{ margin: 0 }}>{s.totalTicketsSold} sold</Tag>
                      <Tag color="green" style={{ margin: 0 }}>{s.checkedIn} checked in</Tag>
                      <Tag color="orange" style={{ margin: 0 }}>{s.pending} remaining</Tag>
                    </div>
                  )}
                </div>
                <ScanOutlined style={{ fontSize: 20, color: 'var(--accent-green)', flexShrink: 0, marginLeft: 12 }} />
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
