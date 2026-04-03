import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography, Card, Row, Col, Tag, Button, Descriptions, Space, Divider, App, theme,
} from 'antd';
import {
  CalendarOutlined, EnvironmentOutlined, TeamOutlined, TagOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';
import { eventsApi } from '../../services/api';
import { tableBookingApi } from '../../services/tableBookingApi';
import { bookingsApi } from '../../services/bookingsApi';
import type { EventDetail, EventTableDto, EventTablesResponse } from '../../types/event';
import type { TableLock } from '../../types/layout';
import { centsToUSD } from '../../utils/currency';
import { formatDateRange } from '../../utils/date';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import TableSelectionGrid from '../../components/booking/TableSelectionGrid';
import CheckoutPanel from '../../components/booking/CheckoutPanel';
import CapacityBookingForm from '../../components/booking/CapacityBookingForm';

type BookingStep = 'info' | 'select-table' | 'checkout' | 'capacity';

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const { isAuthenticated } = useAuth();

  // Booking flow state
  const [step, setStep] = useState<BookingStep>('info');
  const [tablesData, setTablesData] = useState<EventTablesResponse | null>(null);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string>('');
  const [tableLock, setTableLock] = useState<TableLock | null>(null);
  const [confirming, setConfirming] = useState(false);

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

  const loadTables = useCallback(async () => {
    if (!event) return;
    try {
      const { data } = await eventsApi.getTables(event.id);
      setTablesData(data);
    } catch {
      message.error('Failed to load table layout');
    }
  }, [event, message]);

  const handleBookNow = async () => {
    if (!isAuthenticated) {
      message.info('Please log in to book');
      navigate('/login');
      return;
    }
    if (!event) return;

    if (event.ticketTypes.length > 0) {
      setSelectedTicketTypeId(event.ticketTypes[0].id);
    }

    if (event.layoutMode === 'Grid') {
      await loadTables();
      setStep('select-table');
    } else if (event.layoutMode === 'CapacityOnly') {
      setStep('capacity');
    }
  };

  const handleSelectTable = async (table: EventTableDto) => {
    if (!event || !selectedTicketTypeId) return;
    try {
      const { data } = await tableBookingApi.lockTable(event.id, table.id, selectedTicketTypeId);
      setTableLock(data);
      setStep('checkout');
      await loadTables();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      message.error(axiosErr?.response?.data?.message ?? 'Failed to reserve table');
    }
  };

  const handleConfirmPayment = async () => {
    if (!event || !tableLock || !selectedTicketTypeId) return;
    setConfirming(true);
    try {
      const { data: booking } = await bookingsApi.createTableBooking({
        eventId: event.id,
        tableId: tableLock.tableId,
        ticketTypeId: selectedTicketTypeId,
      });
      await bookingsApi.confirmPayment(booking.id);
      message.success('Booking confirmed!');
      navigate('/bookings');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      message.error(axiosErr?.response?.data?.message ?? 'Payment failed');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelLock = async () => {
    if (!event || !tableLock) return;
    try {
      await tableBookingApi.releaseTable(event.id, tableLock.tableId);
    } catch { /* ignore release errors */ }
    setTableLock(null);
    setStep('select-table');
    await loadTables();
  };

  const handleLockExpired = () => {
    message.warning('Your table reservation has expired');
    setTableLock(null);
    setStep('select-table');
    void loadTables();
  };

  const handleCapacityBookingCreated = async (bookingId: string) => {
    try {
      await bookingsApi.confirmPayment(bookingId);
      message.success('Booking confirmed!');
      navigate('/bookings');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      message.error(axiosErr?.response?.data?.message ?? 'Payment failed');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!event) return null;

  const availableTickets = event.ticketTypes.filter((t) => t.quantityAvailable > 0);
  const selectedTicketType = event.ticketTypes.find((t) => t.id === selectedTicketTypeId);

  // Table selection / checkout views
  if (step === 'select-table' && tablesData) {
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => setStep('info')}>
          Back to Event
        </Button>
        <Typography.Title level={3}>Select a Table — {event.title}</Typography.Title>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <TableSelectionGrid
              tables={tablesData.tables}
              gridRows={tablesData.gridRows}
              gridCols={tablesData.gridCols}
              onSelectTable={handleSelectTable}
            />
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Legend" size="small">
              <Space direction="vertical" size="small">
                <Space><div className="seat-cell available" style={{ width: 16, height: 16, minWidth: 16 }} /> Available</Space>
                <Space><div className="seat-cell held" style={{ width: 16, height: 16, minWidth: 16 }} /> Reserved</Space>
                <Space><div className="seat-cell booked" style={{ width: 16, height: 16, minWidth: 16 }} /> Booked</Space>
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    );
  }

  if (step === 'checkout' && tableLock && selectedTicketType) {
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleCancelLock}>
          Back to Table Selection
        </Button>
        <Typography.Title level={3}>Complete Your Booking — {event.title}</Typography.Title>
        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} sm={16} md={12} lg={8}>
            <CheckoutPanel
              tableLock={tableLock}
              ticketType={selectedTicketType}
              confirming={confirming}
              onConfirm={handleConfirmPayment}
              onCancel={handleCancelLock}
              onExpired={handleLockExpired}
            />
          </Col>
        </Row>
      </Space>
    );
  }

  if (step === 'capacity') {
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => setStep('info')}>
          Back to Event
        </Button>
        <Typography.Title level={3}>Reserve Seats — {event.title}</Typography.Title>
        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} sm={16} md={12} lg={8}>
            <CapacityBookingForm
              eventId={event.id}
              maxCapacity={event.maxCapacity ?? 0}
              ticketTypes={availableTickets}
              onBookingCreated={handleCapacityBookingCreated}
            />
          </Col>
        </Row>
      </Space>
    );
  }

  // Default: event info view
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
                <Button type="primary" size="large" block onClick={handleBookNow}>
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
