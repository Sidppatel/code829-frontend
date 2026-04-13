import { motion, type Variants } from 'framer-motion';
import { Space, Tag, Button } from 'antd';
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

  return (
    <section style={{ position: 'relative', width: '100%', height: isMobile ? '55vh' : '65vh', minHeight: isMobile ? 380 : 450, overflow: 'hidden' }}>
      {event.imageUrl ? (
        <img
          src={event.imageUrl}
          alt={event.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <EventImageFallback 
          category={event.category} 
          title={event.title}
          fontSize={isMobile ? "6rem" : "10rem"} 
        />
      )}

      {/* Overlay for Header */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(11, 14, 20, 0.4) 0%, rgba(11, 14, 20, 0.95) 90%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        paddingBottom: isMobile ? 40 : 80,
      }}>
        <div className="page-container">
          <motion.div variants={itemVariants}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isMobile ? 12 : 24,
              marginBottom: isMobile ? 32 : 48,
              width: '100%',
              paddingInline: isMobile ? 4 : 0
            }}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/events')}
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontWeight: 600,
                  fontSize: isMobile ? 14 : 15,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {isMobile ? 'Back' : 'Back to Collection'}
              </Button>

              <Space size={isMobile ? 8 : 12}>
                <Tag style={{ 
                  borderRadius: 10, 
                  border: 'none', 
                  background: 'var(--accent-violet)', 
                  color: '#fff', 
                  fontWeight: 800, 
                  padding: isMobile ? '2px 12px' : '4px 18px',
                  margin: 0
                }}>
                  {event.category}
                </Tag>
                {event.isFeatured && (
                  <Tag style={{ 
                    borderRadius: 10, 
                    border: 'none', 
                    background: 'var(--accent-gold)', 
                    color: '#000', 
                    fontWeight: 800, 
                    padding: isMobile ? '2px 12px' : '4px 18px',
                    margin: 0
                  }}>
                    Featured
                  </Tag>
                )}
              </Space>
            </div>

            <h1 style={{
              fontSize: isMobile ? 'clamp(1.8rem, 10vw, 3rem)' : 'clamp(2.5rem, 8vw, 6rem)',
              fontWeight: 900,
              color: '#fff',
              marginBottom: isMobile ? 16 : 24,
              letterSpacing: '-0.06em',
              lineHeight: 1
            }}>
              {event.title}
            </h1>

            <Space orientation={isMobile ? 'vertical' : 'horizontal'} size={isMobile ? 8 : 40} style={{ color: 'rgba(255,255,255,0.9)', fontSize: isMobile ? 14 : 16, fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CalendarOutlined style={{ color: 'var(--accent-rose)' }} />
                {formatDateRange(event.startDate, event.endDate)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <EnvironmentOutlined style={{ color: 'var(--accent-violet)' }} />
                {event.venue.name}, {event.venue.city}
              </span>
            </Space>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
