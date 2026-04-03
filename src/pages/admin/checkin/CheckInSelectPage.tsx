import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, App, Empty, Skeleton } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, ScanOutlined } from '@ant-design/icons';
import { eventsApi } from '../../../services/eventsApi';
import { formatEventDate } from '../../../utils/date';
import type { EventSummary } from '../../../types/event';
import PageHeader from '../../../components/shared/PageHeader';

export default function CheckInSelectPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await eventsApi.list({ page: 1, pageSize: 50 });
        setEvents(data.items);
      } catch {
        message.error('Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [message]);

  return (
    <div>
      <PageHeader title="Staff Check-In" subtitle="Select an event to start scanning tickets" />

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
        events.map((ev) => (
          <Card
            key={ev.id}
            size="small"
            hoverable
            onClick={() => navigate(`/staff/checkin/${ev.id}`)}
            style={{ marginBottom: 12, cursor: 'pointer' }}
            styles={{ body: { padding: 16 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  {ev.title}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span><CalendarOutlined style={{ marginRight: 4 }} />{formatEventDate(ev.startDate)}</span>
                  <span><EnvironmentOutlined style={{ marginRight: 4 }} />{ev.venueName}, {ev.venueCity}</span>
                </div>
              </div>
              <ScanOutlined style={{ fontSize: 20, color: 'var(--accent-green)', flexShrink: 0, marginLeft: 12 }} />
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
