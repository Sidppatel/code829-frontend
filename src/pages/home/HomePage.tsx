import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Row, Col } from 'antd';
import { ArrowRightOutlined, DownOutlined } from '@ant-design/icons';
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
    <>
      {/* Hero Section */}
      <div className="hero-section">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          style={{ position: 'relative', zIndex: 1, maxWidth: 700 }}
        >
          <h1
            className="text-display"
            style={{
              fontSize: 'clamp(2rem, 6vw, 4rem)',
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              marginBottom: 16,
              fontWeight: 700,
            }}
          >
            Discover Events<br />in Mobile, AL
          </h1>
          <Typography.Paragraph
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
              color: 'var(--text-secondary)',
              maxWidth: 520,
              margin: '0 auto 36px',
            }}
          >
            Browse upcoming events, book your seats, and enjoy unforgettable experiences.
          </Typography.Paragraph>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <div className="hero-cta-row">
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={() => navigate('/events')}
                style={{
                  fontWeight: 600,
                  padding: '0 32px',
                  height: 52,
                  borderRadius: 99,
                  fontSize: 16,
                }}
              >
                Browse Events
              </Button>
              <Button
                size="large"
                ghost
                onClick={() => {
                  const section = document.getElementById('upcoming-section');
                  section?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  fontWeight: 600,
                  padding: '0 32px',
                  height: 52,
                  borderRadius: 99,
                  fontSize: 16,
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ marginTop: 48 }}
          >
            <DownOutlined style={{ fontSize: 20, color: 'var(--text-muted)' }} />
          </motion.div>
        </motion.div>
      </div>

      {/* Featured & Upcoming Sections */}
      {loading ? (
        <div className="page-container">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <motion.section
              className="page-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="section-heading">
                  <h2 style={{ margin: 0, fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', color: 'var(--text-primary)' }}>
                    <span className="gradient-text">Featured</span> Events
                  </h2>
                </div>
                <Button type="link" onClick={() => navigate('/events')} style={{ color: 'var(--accent-violet)' }}>
                  View all
                </Button>
              </div>
              <Row gutter={[20, 20]}>
                {featured.map((event) => (
                  <Col xs={24} sm={12} lg={6} key={event.id}>
                    <div className="hover-lift">
                      <EventCard event={event} />
                    </div>
                  </Col>
                ))}
              </Row>
            </motion.section>
          )}

          <motion.section
            id="upcoming-section"
            className="page-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="section-heading">
                <h2 style={{ margin: 0, fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', color: 'var(--text-primary)' }}>
                  Upcoming Events
                </h2>
              </div>
              <Button type="link" onClick={() => navigate('/events')} style={{ color: 'var(--accent-violet)' }}>
                View all
              </Button>
            </div>
            {upcoming.length > 0 ? (
              <Row gutter={[20, 20]}>
                {upcoming.map((event) => (
                  <Col xs={24} sm={12} lg={8} key={event.id}>
                    <div className="hover-lift">
                      <EventCard event={event} />
                    </div>
                  </Col>
                ))}
              </Row>
            ) : (
              <EmptyState description="No upcoming events yet" />
            )}
          </motion.section>
        </>
      )}
    </>
  );
}
