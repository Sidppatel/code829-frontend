import { Card, Tag, Typography } from 'antd';
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
      className="hover-lift"
      onClick={() => navigate(`/events/${event.slug}`)}
      style={{
        background: '#13131A',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
      styles={{
        body: { padding: 16 },
      }}
      cover={
        event.imageUrl ? (
          <img
            alt={event.title}
            src={event.imageUrl}
            style={{ height: 200, objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              height: 200,
              background: 'linear-gradient(135deg, #1C1C27, #13131A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CalendarOutlined style={{ fontSize: 48, color: '#4B5563' }} />
          </div>
        )
      }
    >
      <Card.Meta
        title={
          <Typography.Text
            strong
            style={{ color: '#F1F0FF', fontSize: 16 }}
            ellipsis
          >
            {event.title}
          </Typography.Text>
        }
        description={
          <>
            <div style={{ marginBottom: 8 }}>
              <CalendarOutlined style={{ marginRight: 6, color: '#7C3AED' }} />
              <Typography.Text style={{ color: '#9CA3AF', fontSize: 13 }}>
                {formatEventDate(event.startDate)}
              </Typography.Text>
            </div>
            <div style={{ marginBottom: 10 }}>
              <EnvironmentOutlined style={{ marginRight: 6, color: '#7C3AED' }} />
              <Typography.Text style={{ color: '#9CA3AF', fontSize: 13 }}>
                {event.venueName}, {event.venueCity}
              </Typography.Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tag
                style={{
                  background: 'rgba(124, 58, 237, 0.15)',
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                  color: '#A78BFA',
                  borderRadius: 6,
                }}
              >
                {event.category}
              </Tag>
              <Typography.Text strong style={{ color: '#F59E0B' }}>
                {priceLabel}
              </Typography.Text>
            </div>
          </>
        }
      />
    </Card>
  );
}
