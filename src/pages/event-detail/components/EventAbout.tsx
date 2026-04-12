import { motion, type Variants } from 'framer-motion';
import { Row, Col, Typography } from 'antd';
import type { EventDetail } from '../../../types/event';
import { useIsMobile } from '../../../hooks/useIsMobile';

interface EventAboutProps {
  event: EventDetail;
  itemVariants: Variants;
}

export default function EventAbout({ event, itemVariants }: EventAboutProps) {
  const isMobile = useIsMobile();

  return (
    <motion.div variants={itemVariants}>
      <div style={{ marginBottom: 80 }}>
        <h3 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 6, height: 32, background: 'var(--accent-violet)', borderRadius: 10 }} />
          About the Experience
        </h3>
        <div style={{
          fontSize: isMobile ? 16 : 18,
          lineHeight: 1.8,
          color: 'var(--text-secondary)',
          background: 'var(--bg-surface)',
          padding: isMobile ? 24 : 40,
          borderRadius: 32,
          border: '1px solid var(--border)',
          boxShadow: 'var(--card-shadow)'
        }}>
          {event.description || 'No description provided for this exclusive event.'}
        </div>
      </div>

      <div style={{ marginBottom: 60 }}>
        <h3 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 6, height: 32, background: 'var(--accent-rose)', borderRadius: 10 }} />
          Venue & Details
        </h3>
        <div className="glass-card" style={{ padding: isMobile ? 24 : 40, borderRadius: 32 }}>
          <Row gutter={[32, 32]}>
            <Col xs={24} md={12}>
              <Typography.Text style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, fontSize: 11, display: 'block', marginBottom: 8 }}>Venue</Typography.Text>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{event.venue.name}</div>
            </Col>
            <Col xs={24} md={12}>
              <Typography.Text style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, fontSize: 11, display: 'block', marginBottom: 8 }}>Address</Typography.Text>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)' }}>
                {event.venue.address}, {event.venue.city}, {event.venue.state}
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </motion.div>
  );
}
