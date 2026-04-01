import { Card, Tag, Typography, theme } from 'antd';
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
  const { token } = theme.useToken();

  const priceLabel = event.minPriceCents
    ? event.minPriceCents === event.maxPriceCents
      ? centsToUSD(event.minPriceCents)
      : `From ${centsToUSD(event.minPriceCents)}`
    : 'Free';

  return (
    <Card
      hoverable
      onClick={() => navigate(`/events/${event.slug}`)}
      cover={
        event.imageUrl ? (
          <img
            alt={event.title}
            src={event.imageUrl}
            style={{ height: 200, objectFit: 'cover' }}
          />
        ) : (
          <div style={{ height: 200, background: token.colorBgLayout, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarOutlined style={{ fontSize: 48, color: token.colorTextQuaternary }} />
          </div>
        )
      }
    >
      <Card.Meta
        title={event.title}
        description={
          <>
            <div style={{ marginBottom: 8 }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              <Typography.Text type="secondary">{formatEventDate(event.startDate)}</Typography.Text>
            </div>
            <div style={{ marginBottom: 8 }}>
              <EnvironmentOutlined style={{ marginRight: 4 }} />
              <Typography.Text type="secondary">
                {event.venueName}, {event.venueCity}
              </Typography.Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tag color="blue">{event.category}</Tag>
              <Typography.Text strong>{priceLabel}</Typography.Text>
            </div>
          </>
        }
      />
    </Card>
  );
}
