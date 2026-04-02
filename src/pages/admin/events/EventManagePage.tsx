import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
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
  EditOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { adminEventsApi } from '../../../services/api';
import { centsToUSD } from '../../../utils/currency';
import { formatDateRange } from '../../../utils/date';
import type { EventDetail } from '../../../types/event';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

const STATUS_MAP: Record<string, { className: string; label: string }> = {
  Draft:     { className: 'status-pill status-draft',     label: 'Draft' },
  Published: { className: 'status-pill status-published', label: 'Published' },
  SoldOut:   { className: 'status-pill status-soldout',   label: 'Sold Out' },
  Cancelled: { className: 'status-pill status-cancelled', label: 'Cancelled' },
  Completed: { className: 'status-pill status-completed', label: 'Completed' },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { className: 'status-pill status-draft', label: status };
  return (
    <span className={s.className}>
      <span className="status-pill-dot" />
      {s.label}
    </span>
  );
}

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
      {/* Section 1 — Event Status Banner */}
      <div className="edit-mode-banner" style={{ marginBottom: 16 }}>
        <StatusPill status={event.status} />
        <span>
          <strong>{event.title}</strong> · {event.category}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {(event.status === 'Draft' || event.status === 'Published') && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => navigate(`/admin/events/${id}/edit`)}
              style={{ borderRadius: 8 }}
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Section 2 — Event Overview Details */}
      <div className="admin-section">
        <div className="admin-section-title"><InfoCircleOutlined /> Overview</div>
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={12}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>DATE & TIME</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatDateRange(event.startDate, event.endDate)}
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>VENUE</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {event.venueName}, {event.venueCity}
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>SEATING LAYOUT</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {event.layoutMode === 'None' ? 'General Admission' : event.layoutMode === 'Grid' ? 'Grid · Table Based' : event.layoutMode}
              {event.maxCapacity && ` · Max ${event.maxCapacity}`}
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>FEATURED</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {event.isFeatured ? '⭐ Yes' : 'No'}
            </div>
          </Col>
        </Row>
      </div>

      {/* Section 3 — Tickets */}
      <div className="admin-section">
        <div className="admin-section-title"><CheckCircleOutlined /> Tickets</div>
        <div className="next-event-stats">
          <div className="next-event-stat">
            <div className="next-event-stat-value">{event.quantitySold}</div>
            <div className="next-event-stat-label">Sold</div>
          </div>
          <div className="next-event-stat">
            <div className="next-event-stat-value">{event.quantityTotal - event.quantitySold}</div>
            <div className="next-event-stat-label">Available</div>
          </div>
          <div className="next-event-stat">
            <div className="next-event-stat-value">
              {event.quantityTotal > 0
                ? `${Math.round((event.quantitySold / event.quantityTotal) * 100)}%`
                : '0%'}
            </div>
            <div className="next-event-stat-label">Fill Rate</div>
          </div>
        </div>
        <div className="next-event-progress-bar" style={{ marginTop: 14 }}>
          <div
            className="next-event-progress-fill"
            style={{
              width: `${event.quantityTotal > 0
                ? Math.min((event.quantitySold / event.quantityTotal) * 100, 100)
                : 0}%`
            }}
          />
        </div>
      </div>

      {/* Section 4 — Ticket Types */}
      {event.ticketTypes.length > 0 && (
        <div className="admin-section">
          <div className="admin-section-title">Ticket Types</div>
          <Row gutter={[16, 16]}>
            {event.ticketTypes.map((tt) => (
              <Col xs={24} sm={12} md={8} key={tt.id}>
                <div className="admin-section" style={{ marginBottom: 0 }}>
                  <div style={{ fontWeight: 600 }}>{tt.name}</div>
                  <div style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{centsToUSD(tt.priceCents)}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {tt.quantitySold} / {tt.quantityTotal} sold
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Section 5 — Quick Links */}
      {event.layoutMode !== 'None' && (
        <Button block icon={<LayoutOutlined />} onClick={() => navigate(`/admin/layout/${id}`)} style={{ borderRadius: 10, marginBottom: 8 }}>
          Manage Seating Layout
        </Button>
      )}
      <Button block icon={<DollarOutlined />} onClick={() => navigate(`/admin/pricing/${id}`)} style={{ borderRadius: 10, marginBottom: 8 }}>
        Pricing
      </Button>
      <Button block icon={<CheckCircleOutlined />} onClick={() => navigate(`/admin/checkin/${id}`)} style={{ borderRadius: 10, marginBottom: 8 }}>
        Check-In
      </Button>

      {/* Section 6 — Status Actions */}
      <div className="admin-section">
        <div className="admin-section-title"><ThunderboltOutlined /> Status Actions</div>
        <Space wrap>
          {event.status === 'Draft' && (
            <Popconfirm title="Publish this event?" description="It will become visible to the public." onConfirm={() => handleStatusChange('Published')} okText="Publish">
              <Button type="primary" style={{ background: '#10B981', borderColor: '#10B981', borderRadius: 10 }} icon={<SendOutlined />}>
                Publish Event
              </Button>
            </Popconfirm>
          )}
          {event.status === 'Published' && (
            <>
              <Popconfirm title="Mark as completed?" onConfirm={() => handleStatusChange('Completed')}>
                <Button icon={<CheckOutlined />} style={{ borderRadius: 10 }}>Mark Complete</Button>
              </Popconfirm>
              <Popconfirm title="Cancel this event?" onConfirm={() => handleStatusChange('Cancelled')}>
                <Button danger icon={<CloseOutlined />} style={{ borderRadius: 10 }}>Cancel Event</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      </div>
    </div>
  );
}
