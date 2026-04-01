import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Row, Col, Space } from 'antd';
import { CalendarOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '80px 24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 600,
              height: 600,
              background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15), transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <CalendarOutlined
            style={{ fontSize: 48, color: '#7C3AED', marginBottom: 16 }}
          />
          <Typography.Title
            level={1}
            style={{
              marginBottom: 8,
              fontFamily: "'Playfair Display', serif",
              color: '#F1F0FF',
              fontSize: 42,
            }}
          >
            Discover Events in Mobile, AL
          </Typography.Title>
          <Typography.Paragraph
            style={{
              fontSize: 18,
              maxWidth: 600,
              margin: '0 auto 32px',
              color: '#9CA3AF',
            }}
          >
            Browse upcoming events, book your seats, and enjoy unforgettable experiences.
          </Typography.Paragraph>
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate('/events')}
            style={{ fontWeight: 600, padding: '0 32px', height: 48 }}
          >
            Browse Events
          </Button>
        </div>
      </motion.div>

      {/* Featured Events */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {featured.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Typography.Title level={3} style={{ margin: 0, color: '#F1F0FF' }}>
                  <span className="gradient-text">Featured</span> Events
                </Typography.Title>
                <Button type="link" onClick={() => navigate('/events')} style={{ color: '#7C3AED' }}>
                  View all
                </Button>
              </div>
              <Row gutter={[24, 24]}>
                {featured.map((event) => (
                  <Col xs={24} sm={12} lg={6} key={event.id}>
                    <EventCard event={event} />
                  </Col>
                ))}
              </Row>
            </motion.section>
          )}

          {/* Upcoming Events */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Typography.Title level={3} style={{ margin: 0, color: '#F1F0FF' }}>
                Upcoming Events
              </Typography.Title>
              <Button type="link" onClick={() => navigate('/events')} style={{ color: '#7C3AED' }}>
                View all
              </Button>
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
          </motion.section>
        </>
      )}
    </Space>
  );
}
