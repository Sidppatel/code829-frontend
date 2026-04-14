import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Row, Col } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { eventsApi } from '../../services/api';
import type { EventSummary } from '@code829/shared/types/event';
import EventCard from '../../components/events/EventCard';
import { cubicBezier } from "framer-motion";

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

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 30, scale: 0.98 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: cubicBezier(0.16, 1, 0.3, 1)
      }
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={containerVariants}
      style={{ minHeight: '100vh', position: 'relative' }}
    >
      {/* Hero Section */}
      <section className="hero-section">
        <div className="page-container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div variants={itemVariants}>
            <div style={{
              display: 'inline-flex',
              padding: '8px 20px',
              borderRadius: 30,
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#C4B5FD',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 32,
              backdropFilter: 'blur(12px)',
            }}>
              ✨ Experience the Unforgettable
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            style={{
              fontSize: 'clamp(3rem, 10vw, 6.5rem)',
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1,
              marginBottom: 32,
              letterSpacing: '-0.06em'
            }}
          >
            Create <span className="gradient-text">Infinite</span> <br />
            Memories.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            style={{
              fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
              color: 'rgba(255, 255, 255, 0.75)',
              maxWidth: 700,
              margin: '0 auto 56px',
              lineHeight: 1.6,
              fontWeight: 500
            }}
          >
            Managing, discovering, and booking exclusive events has never felt this premium. Welcome to the Nebula future.
          </motion.p>

          <motion.div
            variants={itemVariants}
            style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/events')}
              style={{
                height: 64,
                padding: '0 48px',
                borderRadius: 18,
                fontSize: 18,
                fontWeight: 700,
                background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-rose))',
                border: 'none',
                boxShadow: '0 15px 35px rgba(99, 102, 241, 0.35)'
              }}
            >
              Explore Events
            </Button>
            <Button
              size="large"
              className="glass-card"
              onClick={() => navigate('/feedback')}
              style={{
                height: 64,
                padding: '0 48px',
                borderRadius: 18,
                fontSize: 18,
                fontWeight: 600,
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              Request Access
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Featured Section */}
      <div className="page-container" style={{ position: 'relative', zIndex: 10, marginTop: -40 }}>
        {loading ? (
          <Row gutter={[32, 32]}>
            {[1, 2, 3].map((i) => (
              <Col key={i} xs={24} md={12} lg={8}>
                <div style={{ height: 400, borderRadius: 24, background: 'var(--bg-surface)', animation: 'pulse 2s infinite' }} />
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 120, paddingBottom: 150 }}>
            {featured.length > 0 && (
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
                  <motion.div variants={itemVariants}>
                    <div style={{ color: 'var(--accent-rose)', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 12 }}>
                      The Collection
                    </div>
                    <h2 style={{ margin: 0, fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1.5px' }}>
                      Featured Designs
                    </h2>
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <Button
                      type="link"
                      onClick={() => navigate('/events')}
                      style={{ color: 'var(--accent-violet)', fontWeight: 700, fontSize: 16 }}
                    >
                      View All <ArrowRightOutlined />
                    </Button>
                  </motion.div>
                </div>

                <Row gutter={[32, 32]}>
                  {featured.map((event) => (
                    <Col xs={24} sm={12} lg={8} key={event.id}>
                      <motion.div variants={itemVariants} style={{ height: '100%' }}>
                        <EventCard event={event} />
                      </motion.div>
                    </Col>
                  ))}
                </Row>
              </section>
            )}

            <section id="upcoming-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
                <motion.div variants={itemVariants}>
                  <div style={{ color: 'var(--accent-violet)', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 12 }}>
                    Upcoming
                  </div>
                  <h2 style={{ margin: 0, fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1.5px' }}>
                    Latest Experiences
                  </h2>
                </motion.div>
              </div>

              <Row gutter={[32, 64]}>
                {upcoming.map((event) => (
                  <Col xs={24} sm={12} lg={8} key={event.id}>
                    <motion.div variants={itemVariants} style={{ height: '100%' }}>
                      <EventCard event={event} />
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </section>
          </div>
        )}
      </div>
    </motion.div>
  );
}
