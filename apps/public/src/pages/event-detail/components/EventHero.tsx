import { motion, type Variants } from 'framer-motion';
import { Button } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { EventDetail } from '@code829/shared/types/event';
import { formatDateRange } from '@code829/shared/utils/date';
import EventImageFallback from '../../../components/events/EventImageFallback';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';

interface EventHeroProps {
  event: EventDetail;
  itemVariants: Variants;
}

export default function EventHero({ event, itemVariants }: EventHeroProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const isTableLayout = event.layoutMode === 'Grid';
  const pillKind = event.isSoldOut ? 'soldout' : isTableLayout ? 'published' : 'completed';
  const pillLabel = event.isSoldOut ? 'Sold out' : isTableLayout ? 'Table event' : 'Open seating';

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        height: isMobile ? '48vh' : '58vh',
        minHeight: isMobile ? 340 : 420,
        overflow: 'hidden',
      }}
    >
      {event.imageUrl ? (
        <img
          src={event.imageUrl}
          alt={event.title}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <EventImageFallback
          category={event.category}
          title={event.title}
          fontSize={isMobile ? '6rem' : '10rem'}
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(15,11,26,0.20) 0%, rgba(15,11,26,0.55) 55%, var(--bg-page) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          paddingBottom: isMobile ? 28 : 56,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', width: '100%' }}>
          <motion.div variants={itemVariants}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: isMobile ? 20 : 32,
              }}
            >
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/events')}
                style={{
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: isMobile ? 13 : 14,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {isMobile ? 'Back' : 'All events'}
              </Button>
              <span className={`status-pill status-${pillKind}`}>
                <span className="status-pill-dot" />
                {pillLabel}
              </span>
            </div>

            <h1
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: isMobile ? 'clamp(1.9rem, 9vw, 2.6rem)' : 'clamp(2.6rem, 6vw, 4rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 8px',
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                textWrap: 'balance',
              }}
            >
              {event.title}
            </h1>
            {event.description && (
              <p
                style={{
                  fontSize: isMobile ? 14 : 16,
                  color: 'var(--text-secondary)',
                  margin: '0 0 20px',
                  maxWidth: 640,
                  lineHeight: 1.5,
                }}
              >
                {event.description.slice(0, 140)}
                {event.description.length > 140 ? '…' : ''}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                gap: isMobile ? 16 : 32,
                flexWrap: 'wrap',
                color: 'var(--text-secondary)',
                fontSize: isMobile ? 13 : 14,
                fontWeight: 500,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <CalendarOutlined style={{ color: 'var(--primary)' }} />
                {formatDateRange(event.startDate, event.endDate)}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <EnvironmentOutlined style={{ color: 'var(--primary)' }} />
                {event.venue.name}, {event.venue.city}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
