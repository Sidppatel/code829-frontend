import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Row, Col, Space, theme } from 'antd';
import { CalendarOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { eventsApi } from '../../services/api';
import type { EventSummary } from '../../types/event';
import EventCard from '../../components/events/EventCard';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';

export default function HomePage() {
  const [featured, setFeatured] = useState<EventSummary[]>([]);
  const [upcoming, setUpcoming] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { token } = theme.useToken();

  useEffect(() => {
    const load = async () => {
      try {
        const [featRes, upRes] = await Promise.all([
          eventsApi.list({ pageSize: 4 }),
          eventsApi.list({ pageSize: 6 }),
        ]);
        setFeatured(featRes.data.items.filter((e) => e.isFeatured));
        setUpcoming(upRes.data.items);
      } catch {
        // silently fail — page still renders
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Hero */}
      <div
        style={{
          textAlign: 'center',
          padding: '64px 24px',
          background: token.colorPrimaryBg,
          borderRadius: token.borderRadiusLG,
        }}
      >
        <CalendarOutlined style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 16 }} />
        <Typography.Title level={1} style={{ marginBottom: 8 }}>
          Discover Events in Mobile, AL
        </Typography.Title>
        <Typography.Paragraph
          type="secondary"
          style={{ fontSize: 18, maxWidth: 600, margin: '0 auto 24px' }}
        >
          Browse upcoming events, book your seats, and enjoy unforgettable experiences.
        </Typography.Paragraph>
        <Button
          type="primary"
          size="large"
          icon={<ArrowRightOutlined />}
          onClick={() => navigate('/events')}
        >
          Browse Events
        </Button>
      </div>

      {/* Featured Events */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {featured.length > 0 && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Typography.Title level={3} style={{ margin: 0 }}>Featured Events</Typography.Title>
                <Button type="link" onClick={() => navigate('/events')}>View all</Button>
              </div>
              <Row gutter={[24, 24]}>
                {featured.map((event) => (
                  <Col xs={24} sm={12} lg={6} key={event.id}>
                    <EventCard event={event} />
                  </Col>
                ))}
              </Row>
            </section>
          )}

          {/* Upcoming Events */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Typography.Title level={3} style={{ margin: 0 }}>Upcoming Events</Typography.Title>
              <Button type="link" onClick={() => navigate('/events')}>View all</Button>
            </div>
            {upcoming.length > 0 ? (
              <Row gutter={[24, 24]}>
                {upcoming.map((event) => (
                  <Col xs={24} sm={12} lg={8} key={event.id}>
                    <EventCard event={event} />
                  </Col>
                ))}
              </Row>
            ) : (
              <EmptyState description="No upcoming events yet" />
            )}
          </section>
        </>
      )}
    </Space>
  );
}
