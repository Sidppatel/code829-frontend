import { Card, Tag, Typography, Button } from 'antd';
import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { EventSummary } from '../../types/event';
import { centsToUSD } from '../../utils/currency';
import { formatEventDate } from '../../utils/date';

interface Props {
  event: EventSummary;
}

export default function EventCard({ event }: Props) {
  const navigate = useNavigate();

  const priceLabel = event.minPriceCents
    ? event.minPriceCents === event.maxPriceCents
      ? centsToUSD(event.minPriceCents)
      : `From ${centsToUSD(event.minPriceCents)}`
    : 'Free';

  return (
    <Card
      hoverable
      onClick={() => navigate(`/events/${event.slug}`)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        overflow: 'hidden',
      }}
      styles={{ body: { padding: 16 } }}
      cover={
        <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
          {event.imageUrl ? (
            <>
              <img
                alt={event.title}
                src={event.imageUrl}
                style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 60,
                  background: 'linear-gradient(to top, var(--bg-surface), transparent)',
                }}
              />
            </>
          ) : (
            <div
              style={{
                height: 180,
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), var(--bg-elevated))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 56,
                  fontWeight: 700,
                  color: 'var(--accent-violet)',
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                {event.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Price badge */}
          <Tag
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'var(--accent-violet)',
              border: 'none',
              color: 'var(--bg-page)',
              borderRadius: 99,
              fontWeight: 600,
              fontSize: 12,
              padding: '2px 10px',
              backdropFilter: 'blur(8px)',
            }}
          >
            {priceLabel}
          </Tag>
        </div>
      }
    >
      <Typography.Text
        strong
        style={{
          color: 'var(--text-primary)',
          fontSize: 15,
          fontWeight: 600,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.4,
          marginBottom: 10,
        }}
      >
        {event.title}
      </Typography.Text>

      <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        <CalendarOutlined style={{ color: 'var(--accent-gold)', fontSize: 13 }} />
        <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          {formatEventDate(event.startDate)}
        </Typography.Text>
      </div>

      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <EnvironmentOutlined style={{ color: 'var(--text-muted)', fontSize: 13 }} />
        <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 13 }} ellipsis>
          {event.venueName}, {event.venueCity}
        </Typography.Text>
      </div>

      <Button
        type="primary"
        block
        style={{ borderRadius: 10, fontWeight: 600, height: 38 }}
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/events/${event.slug}`);
        }}
      >
        View Details
      </Button>
    </Card>
  );
}
