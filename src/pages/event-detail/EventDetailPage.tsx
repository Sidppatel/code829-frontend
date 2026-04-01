import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography, Card, Row, Col, Tag, Button, Descriptions, Space, Divider, App, theme,
} from 'antd';
import {
  CalendarOutlined, EnvironmentOutlined, TeamOutlined, TagOutlined,
} from '@ant-design/icons';
import { eventsApi } from '../../services/api';
import type { EventDetail } from '../../types/event';
import { centsToUSD } from '../../utils/currency';
import { formatDateRange } from '../../utils/date';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        const { data } = await eventsApi.getBySlug(slug);
        setEvent(data);
      } catch {
        message.error('Event not found');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [slug, message, navigate]);

  if (loading) return <LoadingSpinner />;
  if (!event) return null;

  const availableTickets = event.ticketTypes.filter((t) => t.quantityAvailable > 0);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Banner */}
      {event.imageUrl ? (
        <img
          src={event.imageUrl}
          alt={event.title}
          style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: token.borderRadiusLG }}
        />
      ) : (
        <div
          style={{
            height: 240,
            background: token.colorPrimaryBg,
            borderRadius: token.borderRadiusLG,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CalendarOutlined style={{ fontSize: 64, color: token.colorPrimary }} />
        </div>
      )}

      <Row gutter={[32, 24]}>
        {/* Event Info */}
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Tag color="blue">{event.category}</Tag>
              {event.isFeatured && <Tag color="gold">Featured</Tag>}
            </div>
            <Typography.Title level={2} style={{ margin: 0 }}>
              {event.title}
            </Typography.Title>

            <Descriptions column={1} size="small">
              <Descriptions.Item label={<><CalendarOutlined /> Date</>}>
                {formatDateRange(event.startDate, event.endDate)}
              </Descriptions.Item>
              <Descriptions.Item label={<><EnvironmentOutlined /> Venue</>}>
                {event.venue.name}, {event.venue.city}, {event.venue.state}
              </Descriptions.Item>
              {event.venue.address && (
                <Descriptions.Item label="Address">
                  {event.venue.address}, {event.venue.zipCode}
                </Descriptions.Item>
              )}
            </Descriptions>

            {event.description && (
              <>
                <Divider />
                <Typography.Title level={4}>About This Event</Typography.Title>
                <Typography.Paragraph>{event.description}</Typography.Paragraph>
              </>
            )}
          </Space>
        </Col>

        {/* Booking Panel */}
        <Col xs={24} lg={8}>
          <Card title="Tickets" styles={{ header: { borderBottom: 'none' } }}>
            {availableTickets.length > 0 ? (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {event.ticketTypes.map((tt) => (
                  <div
                    key={tt.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                    }}
                  >
                    <div>
                      <Typography.Text strong>{tt.name}</Typography.Text>
                      {tt.description && (
                        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                          {tt.description}
                        </Typography.Text>
                      )}
                      <Space size="small" style={{ marginTop: 4 }}>
                        <Tag icon={<TeamOutlined />} color="default">
                          {tt.quantityAvailable} left
                        </Tag>
                      </Space>
                    </div>
                    <Typography.Text strong style={{ fontSize: 16 }}>
                      {tt.priceCents === 0 ? 'Free' : centsToUSD(tt.priceCents)}
                    </Typography.Text>
                  </div>
                ))}
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography.Text type="secondary">
                    <TagOutlined /> Platform fee applies
                  </Typography.Text>
                </div>
                <Button type="primary" size="large" block>
                  Book Now
                </Button>
              </Space>
            ) : (
              <Typography.Text type="secondary">No tickets available</Typography.Text>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
