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
  BorderOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { adminEventsApi } from '../../services/adminEventsApi';
import { adminLayoutApi } from '../../services/api';
import { centsToUSD } from '@code829/shared/utils/currency';
import { formatDateRange } from '@code829/shared/utils/date';
import type { EventDetail } from '@code829/shared/types/event';
import type { LayoutStatsResponse } from '@code829/shared/types/layout';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import EventPricingTiersTable from '../../components/events/EventPricingTiersTable';
import HumanCard from '@code829/shared/components/shared/HumanCard';

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
  const { message } = App.useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const { data } = await adminEventsApi.getById(id);
        setEvent(data);

        // Load layout lock status for Grid events
        if (data.layoutMode === 'Grid') {
          const lockedRes = await adminEventsApi.checkLayoutLocked(id);
          setLayoutLocked(lockedRes.data.locked);
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
              onClick={() => navigate(`/events/${id}/edit`)}
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
              {event.venueName || event.venue?.name || 'Virtual'}
              { (event.venueCity || event.venue?.city) ? `, ${event.venueCity || event.venue?.city}` : '' }
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
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
          <div style={{ 
            width: 32, 
            height: 32, 
            borderRadius: 8, 
            background: 'var(--primary-soft)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <AppstoreOutlined />
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Seating & Pricing</h3>
        </div>

        <HumanCard 
          className="human-noise" 
          style={{ padding: 24, border: '1px solid var(--border-soft)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Tag 
              color="blue" 
              icon={isOpen ? <UserOutlined /> : <BorderOutlined />}
              style={{ borderRadius: 6, padding: '2px 10px', fontWeight: 600 }}
            >
              {isOpen ? 'Open Seating' : 'Table Seating (Grid)'}
            </Tag>
            {!isOpen && (
              <Tag color="purple" style={{ borderRadius: 6, fontWeight: 600 }}>
                {event.gridRows} × {event.gridCols} Layout
              </Tag>
            )}
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={8}>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                Max Capacity
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                {event.maxCapacity || 'Unlimited'}
              </div>
            </Col>
            
            {!isOpen && (
              <Col xs={24} sm={8}>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Available Tables
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                  {event.noOfAvailableTables}
                </div>
              </Col>
            )}

            <Col xs={24} sm={8}>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                Total Sold / Booked
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                {event.totalSold}
              </div>
            </Col>
          </Row>
                  {/* Pricing Tiers Breakdown */}
                  {event.pricingTiers && event.pricingTiers.length > 0 && (
                    <div style={{ marginTop: 32 }}>
                      <div style={{ 
                        color: 'var(--text-muted)', 
                        fontSize: 11, 
                        fontWeight: 700, 
                        textTransform: 'uppercase', 
                        letterSpacing: 1, 
                        marginBottom: 16 
                      }}>
                        Detailed Pricing Breakdown
                      </div>
                      <EventPricingTiersTable 
                        tiers={event.pricingTiers} 
                        layoutMode={isOpen ? 'Open' : 'Grid'} 
                      />
                    </div>
                  )}

                  {(!event.pricingTiers || event.pricingTiers.length === 0) && (
                    <div style={{ 
                      marginTop: 24, 
                      padding: '24px', 
                      borderRadius: 12, 
                      background: 'var(--bg-soft)', 
                      border: '1px dashed var(--border-soft)',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        No pricing tiers defined. Edit event to add ticket types or place tables on the layout.
                      </div>
                    </div>
                  )}
                </HumanCard>
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
        {(() => {
          const sold = event.totalSold ?? 0;
          const total = event.totalCapacity ?? 0;
          const available = total - sold;
          const fillRate = total > 0 ? Math.round((sold / total) * 100) : 0;
          return (
            <>
              <div className="next-event-stats">
                <div className="next-event-stat">
                  <div className="next-event-stat-value">{sold}</div>
                  <div className="next-event-stat-label">Sold</div>
                </div>
                <div className="next-event-stat">
                  <div className="next-event-stat-value">{available}</div>
                  <div className="next-event-stat-label">Available</div>
                </div>
                {event.layoutMode === 'Grid' && (
                  <div className="next-event-stat">
                    <div className="next-event-stat-value">{event.noOfAvailableTables}</div>
                    <div className="next-event-stat-label">Avail. Tables</div>
                  </div>
                )}
                <div className="next-event-stat">
                  <div className="next-event-stat-value">{fillRate}%</div>
                  <div className="next-event-stat-label">Fill Rate</div>
                </div>
              </div>
              <div className="next-event-progress-bar" style={{ marginTop: 14 }}>
                <div
                  className="next-event-progress-fill"
                  style={{ width: `${Math.min(fillRate, 100)}%` }}
                />
              </div>
            </>
          );
        })()}
      </div>

      {/* Section 5 -- Quick Links */}
      {isGrid && (
        <Button
          block
          icon={<LayoutOutlined />}
          onClick={() => navigate(`/layout/${id}`)}
          style={{ borderRadius: 10, marginBottom: 8 }}
        >
          {layoutLocked ? 'View Layout (Locked)' : 'Manage Seating Layout'}
        </Button>
      )}
      <Button
        block
        icon={<CheckCircleOutlined />}
        onClick={() => navigate(`/checkin/${id}`)}
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
