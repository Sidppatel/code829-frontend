import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Space,
  App,
  Row,
  Col,
  Popconfirm,
  Tag,
  Alert,
} from 'antd';
import {
  LayoutOutlined,
  CheckCircleOutlined,
  EditOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  LockOutlined,
  AppstoreOutlined,
  TeamOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { adminEventsApi } from '../../../services/adminEventsApi';
import { adminLayoutApi } from '../../../services/api';
import { centsToUSD } from '../../../utils/currency';
import { formatDateRange } from '../../../utils/date';
import type { EventDetail } from '../../../types/event';
import type { LayoutStatsResponse } from '../../../types/layout';
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
  const [layoutLocked, setLayoutLocked] = useState(false);
  const [layoutStats, setLayoutStats] = useState<LayoutStatsResponse | null>(null);
  const { message } = App.useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const { data } = await adminEventsApi.getById(id);
        setEvent(data);

        // Load layout lock status and stats for Grid events
        if (data.layoutMode === 'Grid') {
          const [lockedRes, statsRes] = await Promise.all([
            adminEventsApi.checkLayoutLocked(id),
            adminLayoutApi.getLayoutStats(id),
          ]);
          setLayoutLocked(lockedRes.data.locked);
          setLayoutStats(statsRes.data);
        }
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

  const isGrid = event.layoutMode === 'Grid';
  const isOpen = event.layoutMode === 'Open';

  return (
    <div>
      {/* Section 1 -- Event Status Banner */}
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

      {/* Section 2 -- Event Overview Details */}
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
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>FEATURED</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {event.isFeatured ? 'Yes' : 'No'}
            </div>
          </Col>
        </Row>
      </div>

      {/* Section 3 -- Seating & Pricing */}
      <div className="admin-section">
        <div className="admin-section-title"><AppstoreOutlined /> Seating & Pricing</div>

        <div style={{ marginBottom: 12 }}>
          <Tag
            color={isGrid ? 'purple' : 'blue'}
            style={{ fontSize: 14, padding: '4px 12px', borderRadius: 8 }}
          >
            {isGrid && <><AppstoreOutlined style={{ marginRight: 6 }} />Table Seating (Grid)</>}
            {isOpen && <><TeamOutlined style={{ marginRight: 6 }} />Open Seating</>}
          </Tag>
        </div>

        {isGrid && (
          <Row gutter={[16, 12]}>
            <Col xs={12} sm={8}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>TABLES</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 18 }}>
                {layoutStats?.totalTables ?? 0}
              </div>
            </Col>
            <Col xs={12} sm={8}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>TOTAL CAPACITY</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 18 }}>
                {layoutStats?.totalCapacity ?? 0}
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>POTENTIAL REVENUE</div>
              <div style={{ fontWeight: 600, color: 'var(--accent-gold)', fontSize: 18 }}>
                {centsToUSD(layoutStats?.totalPotentialRevenueCents ?? 0)}
              </div>
            </Col>
          </Row>
        )}

        {isOpen && (
          <Row gutter={[16, 12]}>
            <Col xs={12} sm={8}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>MAX CAPACITY</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 18 }}>
                {event.maxCapacity ?? 'N/A'}
              </div>
            </Col>
            <Col xs={12} sm={8}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>PRICE PER PERSON</div>
              <div style={{ fontWeight: 600, color: 'var(--accent-gold)', fontSize: 18 }}>
                {event.pricePerPersonCents != null
                  ? centsToUSD(event.pricePerPersonCents)
                  : 'N/A'}
              </div>
            </Col>
          </Row>
        )}
      </div>

      {/* Layout lock warning */}
      {isGrid && layoutLocked && (
        <Alert
          message="Layout Locked"
          description="Tables cannot be modified because bookings exist for this event."
          type="warning"
          icon={<LockOutlined />}
          showIcon
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Section 4 -- Sales Stats */}
      <div className="admin-section">
        <div className="admin-section-title"><DollarOutlined /> Sales</div>
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

      {/* Section 5 -- Quick Links */}
      {isGrid && (
        <Button
          block
          icon={<LayoutOutlined />}
          onClick={() => navigate(`/admin/layout/${id}`)}
          style={{ borderRadius: 10, marginBottom: 8 }}
        >
          {layoutLocked ? 'View Layout (Locked)' : 'Manage Seating Layout'}
        </Button>
      )}
      <Button
        block
        icon={<CheckCircleOutlined />}
        onClick={() => navigate(`/admin/checkin/${id}`)}
        style={{ borderRadius: 10, marginBottom: 8 }}
      >
        Check-In
      </Button>

      {/* Section 6 -- Status Actions */}
      <div className="admin-section">
        <div className="admin-section-title"><ThunderboltOutlined /> Status Actions</div>
        <Space wrap>
          {event.status === 'Draft' && (
            <Popconfirm
              title="Publish this event?"
              description="It will become visible to the public."
              onConfirm={() => handleStatusChange('Published')}
              okText="Publish"
            >
              <Button
                type="primary"
                style={{ background: 'var(--accent-green)', borderColor: 'var(--accent-green)', borderRadius: 10 }}
                icon={<SendOutlined />}
              >
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
