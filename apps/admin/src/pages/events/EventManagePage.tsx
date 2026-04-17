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
  DollarOutlined,
  BorderOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { adminEventsApi } from '../../services/api';
import { formatDateRange } from '@code829/shared/utils/date';
import type { EventDetail } from '@code829/shared/types/event';
import type { EventStats } from '@code829/shared/services/adminEventsApi';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import EventPricingTiersTable from '../../components/events/EventPricingTiersTable';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Admin/EventManagePage');

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
  const [stats, setStats] = useState<EventStats | null>(null);
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

        const statsRes = await adminEventsApi.getStats(id);
        setStats(statsRes.data);

        if (data.layoutMode === 'Grid') {
          const lockedRes = await adminEventsApi.checkLayoutLocked(id);
          setLayoutLocked(lockedRes.data.locked);
        }
        log.info('Event loaded', { id, status: data.status, layoutMode: data.layoutMode });
      } catch (err) {
        log.error('Failed to load event', err);
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
      log.info('Event status changed', { id, status });
      message.success(`Status changed to ${status}`);
      const { data } = await adminEventsApi.getById(id);
      setEvent(data);
    } catch (err) {
      log.error('Failed to change event status', err);
      message.error('Failed to change status');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!event) return null;

  const isGrid = event.layoutMode === 'Grid';
  const isOpen = event.layoutMode === 'Open';

  const ticketTypes = (event.ticketTypes || []) as any[];
  const tableTypes = (event.tableTypes || []) as any[];

  const pricingRows = isGrid
    ? tableTypes.map((tt: any) => ({
        id: tt.id,
        name: tt.label,
        priceCents: tt.priceCents,
        platformFeeCents: tt.platformFeeCents ?? null,
        soldCount: tt.bookedTables || 0,
        capacity: tt.totalTables || null,
        seatCapacity: tt.capacity,
        description: `${tt.shape}${tt.color ? '' : ''}`,
      }))
    : ticketTypes.map((tt: any) => ({
        id: tt.id,
        name: tt.label || tt.name,
        priceCents: tt.priceCents,
        platformFeeCents: tt.platformFeeCents ?? null,
        soldCount: tt.soldCount || 0,
        capacity: tt.maxQuantity ?? tt.capacity ?? null,
        description: tt.description,
      }));

  const totalSold = stats?.totalSold ?? 0;
  const calculatedMaxCapacity = stats?.maxCapacity ?? 0;

  return (
    <div>
      {/* Section 1 -- Event Status Banner */}
      <div className="edit-mode-banner" style={{ marginBottom: 24 }}>
        <StatusPill status={event.status} />
        <span style={{ fontSize: 15 }}>
          <strong>{event.title}</strong> · <span style={{ color: 'var(--text-muted)' }}>{event.category}</span>
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {(event.status === 'Draft' || event.status === 'Published') && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => navigate(`/events/${id}/edit`)}
              style={{ borderRadius: 8, height: 32, padding: '0 16px', fontWeight: 600 }}
            >
              Edit Details
            </Button>
          )}
        </div>
      </div>

      {/* Section 2 -- Event Overview Details */}
      <HumanCard style={{ marginBottom: 24, padding: 24, border: '1px solid var(--border)' }}>
        <div className="admin-section-title" style={{ marginBottom: 20 }}>
          <InfoCircleOutlined style={{ color: 'var(--primary)' }} /> Overview
        </div>
        <Row gutter={[32, 20]}>
          <Col xs={24} sm={8}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date & Time</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatDateRange(event.startDate, event.endDate)}
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Venue</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {event.venueName || event.venue?.name || 'Virtual'}
              { (event.venueCity || event.venue?.city) ? `, ${event.venueCity || event.venue?.city}` : '' }
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Featured</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              <Tag style={{ color: event.isFeatured ? 'var(--accent-gold)' : 'var(--text-secondary)', background: event.isFeatured ? 'color-mix(in srgb, var(--accent-gold) 14%, transparent)' : 'var(--bg-soft)', borderColor: event.isFeatured ? 'color-mix(in srgb, var(--accent-gold) 24%, transparent)' : 'var(--border)', borderRadius: 4, fontWeight: 700, margin: 0 }}>
                {event.isFeatured ? 'FEATURED' : 'NO'}
              </Tag>
            </div>
          </Col>
        </Row>
      </HumanCard>

      {/* Section 3 -- Seating & Pricing */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ 
            width: 36, 
            height: 36, 
            borderRadius: 10, 
            background: 'var(--primary-soft)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--primary)',
            fontSize: 18
          }}>
            <AppstoreOutlined />
          </div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' }}>Seating & Pricing</h3>
        </div>

        <HumanCard 
          className="human-noise" 
          style={{ padding: 28, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <Tag 
              color="blue" 
              icon={isOpen ? <UserOutlined /> : <BorderOutlined />}
              style={{ borderRadius: 6, padding: '4px 12px', fontWeight: 700, fontSize: 12, border: 'none' }}
            >
              {isOpen ? 'OPEN SEATING' : 'TABLE SEATING (GRID)'}
            </Tag>
            {!isOpen && (
              <Tag color="purple" style={{ borderRadius: 6, padding: '4px 12px', fontWeight: 700, fontSize: 12, border: 'none' }}>
                {event.gridRows} × {event.gridCols} LAYOUT
              </Tag>
            )}
          </div>

          <Row gutter={[32, 32]} style={{ marginBottom: pricingRows.length > 0 ? 32 : 0 }}>
            <Col xs={24} sm={8}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
                {isGrid ? 'Total Tables' : 'Max Capacity'}
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                {calculatedMaxCapacity > 0 ? calculatedMaxCapacity : 'Unlimited'}
              </div>
            </Col>

            {!isOpen && (
              <Col xs={24} sm={8}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
                  Available Tables
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                  {event.noOfAvailableTables}
                </div>
              </Col>
            )}

            <Col xs={24} sm={8}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
                Sold / Capacity
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent-violet)', letterSpacing: '-1px' }}>
                {totalSold} <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-muted)' }}>/ {calculatedMaxCapacity > 0 ? calculatedMaxCapacity : '∞'}</span>
              </div>
            </Col>
          </Row>
                  {/* Pricing Tiers Breakdown */}
                  {pricingRows.length > 0 && (
                    <div style={{ marginTop: 32 }}>
                      <div style={{
                        color: 'var(--text-muted)',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        marginBottom: 16
                      }}>
                        Pricing Breakdown
                      </div>
                      <EventPricingTiersTable tiers={pricingRows} mode={isGrid ? 'grid' : 'open'} />
                    </div>
                  )}

                  {pricingRows.length === 0 && (
                    <div style={{
                      marginTop: 24,
                      padding: '24px',
                      borderRadius: 12,
                      background: 'var(--bg-soft)',
                      border: '1px dashed var(--border)',
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
          const sold = stats?.totalSold ?? 0;
          const total = stats?.maxCapacity ?? 0;
          const available = isGrid ? (event.noOfAvailableTables ?? 0) : Math.max(total - sold, 0);
          const fillRate = stats?.fillRatePct ?? 0;
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
