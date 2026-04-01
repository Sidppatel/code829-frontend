import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  App,
  Row,
  Col,
  Popconfirm,
} from 'antd';
import {
  LayoutOutlined,
  DollarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { adminEventsApi } from '../../../services/api';
import { centsToUSD } from '../../../utils/currency';
import { formatDateRange } from '../../../utils/date';
import type { EventDetail } from '../../../types/event';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

const statusColors: Record<string, string> = {
  Draft: 'default',
  Published: 'green',
  SoldOut: 'gold',
  Cancelled: 'red',
  Completed: 'blue',
};

export default function EventManagePage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const { data } = await adminEventsApi.getById(id);
        setEvent(data);
      } catch {
        message.error('Failed to load event');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id, message]);

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    try {
      await adminEventsApi.changeStatus(id, status);
      message.success(`Status changed to ${status}`);
      const { data } = await adminEventsApi.getById(id);
      setEvent(data);
    } catch {
      message.error('Failed to change status');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!event) return null;

  return (
    <div>
      <PageHeader
        title={event.title}
        subtitle={`${event.category} \u00b7 ${event.venueName}`}
        extra={
          <Space>
            {event.layoutMode !== 'None' && (
              <Button
                icon={<LayoutOutlined />}
                onClick={() => navigate(`/admin/layout/${event.id}`)}
              >
                Layout
              </Button>
            )}
            <Button
              icon={<DollarOutlined />}
              onClick={() => navigate(`/admin/pricing/${event.id}`)}
            >
              Pricing
            </Button>
            <Button
              icon={<CheckCircleOutlined />}
              onClick={() => navigate(`/admin/checkin/${event.id}`)}
            >
              Check-In
            </Button>
          </Space>
        }
      />
      <Card>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered>
          <Descriptions.Item label="Status">
            <Tag color={statusColors[event.status] ?? 'default'}>
              {event.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Dates">
            {formatDateRange(event.startDate, event.endDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Venue">
            {event.venueName}, {event.venueCity}
          </Descriptions.Item>
          <Descriptions.Item label="Layout Mode">
            {event.layoutMode}
          </Descriptions.Item>
          <Descriptions.Item label="Tickets Sold">
            {event.quantitySold} / {event.quantityTotal}
          </Descriptions.Item>
          <Descriptions.Item label="Featured">
            {event.isFeatured ? 'Yes' : 'No'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {event.ticketTypes.length > 0 && (
        <Card title="Ticket Types" style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            {event.ticketTypes.map((tt) => (
              <Col xs={24} sm={12} md={8} key={tt.id}>
                <Card size="small" className="stat-card">
                  <div style={{ fontWeight: 600 }}>{tt.name}</div>
                  <div>{centsToUSD(tt.priceCents)}</div>
                  <div style={{ opacity: 0.6 }}>
                    {tt.quantitySold} / {tt.quantityTotal} sold
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Card title="Actions" style={{ marginTop: 16 }}>
        <Space wrap>
          {event.status === 'Draft' && (
            <Popconfirm
              title="Publish this event?"
              onConfirm={() => handleStatusChange('Published')}
            >
              <Button type="primary">Publish</Button>
            </Popconfirm>
          )}
          {event.status === 'Published' && (
            <Popconfirm
              title="Cancel this event?"
              onConfirm={() => handleStatusChange('Cancelled')}
            >
              <Button danger>Cancel Event</Button>
            </Popconfirm>
          )}
          {event.status === 'Published' && (
            <Popconfirm
              title="Mark as completed?"
              onConfirm={() => handleStatusChange('Completed')}
            >
              <Button>Complete</Button>
            </Popconfirm>
          )}
        </Space>
      </Card>
    </div>
  );
}
