import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography, Card, Row, Col, Tag, Button, Descriptions, Space, Divider, App, theme,
} from 'antd';
import {
  CalendarOutlined, EnvironmentOutlined, ArrowLeftOutlined, TagOutlined,
} from '@ant-design/icons';
import { eventsApi } from '../../services/eventsApi';
import { tableBookingApi } from '../../services/tableBookingApi';
import { bookingsApi } from '../../services/bookingsApi';
import type { EventDetail, EventTableDto, EventTablesResponse } from '../../types/event';
import type { TableLock } from '../../types/layout';
import { centsToUSD } from '../../utils/currency';
import { formatDateRange } from '../../utils/date';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import TableSelectionCanvas from '../../components/booking/TableSelectionCanvas';
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
  const [tableLock, setTableLock] = useState<TableLock | null>(null);
  const [lockingTableId, setLockingTableId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

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

    if (event.layoutMode === 'Grid') {
      await loadTables();
      setStep('select-table');
    } else if (event.layoutMode === 'Open') {
      setStep('capacity');
    }
  };

  // Clicking a table immediately locks it
  const handleLockTable = async (table: EventTableDto) => {
    if (!event) return;
    setLockingTableId(table.id);
    try {
      const { data } = await tableBookingApi.lockTable(event.id, table.id);
      setTableLock(data);
      setCheckoutError(null);
      await loadTables();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      message.error(axiosErr?.response?.data?.message ?? 'Failed to reserve table');
    } finally {
      setLockingTableId(null);
    }
  };

  const handleProceedToCheckout = () => {
    if (!tableLock) return;
    setStep('checkout');
  };

  const handleConfirmPayment = async () => {
    if (!event || !tableLock) return;
    setConfirming(true);
    setCheckoutError(null);
    try {
      const { data: booking } = await bookingsApi.create({
        eventId: event.id,
        tableId: tableLock.tableId,
      });
      await bookingsApi.confirmPayment(booking.id);
      message.success('Booking confirmed!');
      navigate('/bookings');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setCheckoutError(axiosErr?.response?.data?.message ?? 'Payment failed');
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
    setCheckoutError(null);
    if (step === 'checkout') {
      setStep('select-table');
    }
    await loadTables();
  };

  const handleLockExpired = () => {
    message.warning('Your table reservation has expired');
    setTableLock(null);
    setCheckoutError(null);
    if (step === 'checkout') {
      setStep('select-table');
    }
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

  const feePercent = event.platformFeePercent ?? 0;

  // Find the user's locked table from tablesData for the canvas
  const lockedTableFromGrid = tablesData?.tables.find((t) => t.isLockedByYou) ?? null;

  // Table selection view
  if (step === 'select-table' && tablesData) {
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => { void handleCancelLock(); setStep('info'); }}>
          Back to Event
        </Button>
        <Typography.Title level={3}>Select a Table &mdash; {event.title}</Typography.Title>
        <TableSelectionCanvas
          tables={tablesData.tables}
          eventTableTypes={tablesData.eventTableTypes ?? []}
          gridRows={tablesData.gridRows ?? 10}
          gridCols={tablesData.gridCols ?? 10}
          lockedTable={lockedTableFromGrid}
          onLockTable={handleLockTable}
          onProceedToCheckout={handleProceedToCheckout}
          onReleaseLock={handleCancelLock}
          lockingTableId={lockingTableId}
          onLockExpired={handleLockExpired}
        />
      </Space>
    );
  }

  // Checkout view (Grid)
  if (step === 'checkout' && tableLock) {
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleCancelLock}>
          Back to Table Selection
        </Button>
        <Typography.Title level={3}>Complete Your Booking &mdash; {event.title}</Typography.Title>
        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} sm={16} md={12} lg={8}>
            <CheckoutPanel
              mode="grid"
              tableLock={tableLock}
              platformFeePercent={feePercent}
              confirming={confirming}
              error={checkoutError}
              onConfirm={handleConfirmPayment}
              onCancel={handleCancelLock}
              onExpired={handleLockExpired}
            />
          </Col>
        </Row>
      </Space>
    );
  }

  // Capacity booking view (Open)
  if (step === 'capacity') {
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => setStep('info')}>
          Back to Event
        </Button>
        <Typography.Title level={3}>Reserve Seats &mdash; {event.title}</Typography.Title>
        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} sm={16} md={12} lg={8}>
            <CapacityBookingForm
              eventId={event.id}
              maxCapacity={event.maxCapacity ?? 0}
              totalSold={event.quantitySold}
              pricePerPersonCents={event.pricePerPersonCents ?? 0}
              platformFeePercent={feePercent}
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
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/events')}>
        All Events
      </Button>
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
          <Card title="Booking" styles={{ header: { borderBottom: 'none' } }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {event.layoutMode === 'Grid' ? (
                <>
                  <Typography.Text>
                    Table seating &mdash; book an entire table for your group
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Each table has a fixed price that covers all seats. Select your preferred table on the floor plan.
                  </Typography.Text>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography.Text type="secondary">
                      <TagOutlined /> Platform fee applies
                    </Typography.Text>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography.Text type="secondary">Price per person</Typography.Text>
                    <Typography.Text strong>
                      {event.pricePerPersonCents
                        ? centsToUSD(event.pricePerPersonCents)
                        : 'Free'}
                    </Typography.Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography.Text type="secondary">Available</Typography.Text>
                    <Typography.Text>
                      {(event.maxCapacity ?? 0) - event.quantitySold} of {event.maxCapacity ?? 0} seats
                    </Typography.Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography.Text type="secondary">
                      <TagOutlined /> Platform fee applies
                    </Typography.Text>
                  </div>
                </>
              )}
              <Button type="primary" size="large" block onClick={handleBookNow}>
                Book Now
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
