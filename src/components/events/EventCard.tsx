import { Tag, Space } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, ArrowRightOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { EventSummary } from '../../types/event';
import { centsToUSD } from '../../utils/currency';
import { formatEventDate } from '../../utils/date';
import EventImageFallback from './EventImageFallback';

interface Props {
  event: EventSummary;
}

export default function EventCard({ event }: Props) {
  const navigate = useNavigate();

  const displayPrice = event.minPricePerTableCents ?? event.pricePerPersonCents;
  const priceLabel = displayPrice
    ? centsToUSD(displayPrice)
    : 'Free';

  return (
    <div 
      className="glass-card hover-lift"
      onClick={() => navigate(`/events/${event.slug}`)}
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
            }}
          />
        ) : (
          <EventImageFallback category={event.category} title={event.title} />
        )}
        
        <div style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 2,
        }}>
          <Tag 
            style={{ 
              borderRadius: 10, 
              border: 'none', 
              background: 'rgba(0,0,0,0.6)', 
              backdropFilter: 'blur(10px)', 
              WebkitBackdropFilter: 'blur(10px)',
              color: '#fff', 
              fontWeight: 700, 
              padding: '4px 12px' 
            }}
          >
            {event.category}
          </Tag>
        </div>
      </div>

      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, lineHeight: 1.2 }}>
          {event.title}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <Space style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            <CalendarOutlined style={{ color: 'var(--accent-rose)' }} />
            {formatEventDate(event.startDate)}
          </Space>
          <Space style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            <EnvironmentOutlined style={{ color: 'var(--accent-violet)' }} />
            {(() => {
              const name = event.venueName || event.venue?.name || 'Virtual';
              const city = event.venueCity || event.venue?.city;
              return city ? `${city}, ${name}` : name;
            })()}
          </Space>
          {event.layoutMode === 'Grid' && (
            <Space style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              <AppstoreOutlined style={{ color: 'var(--accent-violet)' }} />
              {event.noOfAvailableTables} tables available
            </Space>
          )}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Starting at</span>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-violet)' }}>
              {priceLabel}
            </div>
          </div>
          <div style={{ 
            width: 44, 
            height: 44, 
            borderRadius: 12, 
            background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-rose))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 20,
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
          }}>
            <ArrowRightOutlined />
          </div>
        </div>
      </div>
    </div>
  );
}
