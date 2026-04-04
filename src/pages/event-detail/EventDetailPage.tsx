import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography, Card, Row, Col, Tag, Button, Descriptions, Space, Divider, App, theme,
} from 'antd';
import {
  CalendarOutlined, EnvironmentOutlined, ArrowLeftOutlined, TagOutlined,
} from '@ant-design/icons';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';
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

type BookingStep = 'info' | 'select-table' | 'checkout' | 'capacity' | 'checkout-open';

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
  const [seatCount, setSeatCount] = useState(1);

  // Stripe state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const stripePromiseRef = useRef<Promise<Stripe | null> | null>(null);

  // Refs for cleanup (accessible in beforeunload/unmount)
  const tableLockRef = useRef<TableLock | null>(null);
  const eventRef = useRef<EventDetail | null>(null);

  useEffect(() => { tableLockRef.current = tableLock; }, [tableLock]);
  useEffect(() => { eventRef.current = event; }, [event]);

  // Release table lock on page leave (close tab, navigate away, refresh)
  useEffect(() => {
    const releaseLock = () => {
      const lock = tableLockRef.current;
      const ev = eventRef.current;
      if (!lock || !ev) return;
      // Use sendBeacon for reliable fire-and-forget on page unload
      const apiUrl = import.meta.env.VITE_API_URL ?? '';
      const token = localStorage.getItem('code829-auth');
      if (token) {
        try {
          const parsed = JSON.parse(token) as { state?: { token?: string } };
          const jwt = parsed?.state?.token;
          if (jwt) {
            const payload = JSON.stringify({ eventId: ev.id, tableId: lock.tableId, token: jwt });
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon(`${apiUrl}/tables/release-beacon`, blob);
          }
        } catch { /* ignore */ }
      }
    };

    const handleBeforeUnload = () => {
      releaseLock();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also release on unmount (navigating to different route)
      releaseLock();
    };
  }, []);

  // Load Stripe publishable key once
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await bookingsApi.getStripeConfig();
        if (data.publishableKey) {
          stripePromiseRef.current = loadStripe(data.publishableKey);
        }
      } catch {
        // Stripe not configured — will show loading state in checkout
      }
    };
    void init();
  }, []);

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
      const [tablesRes, locksRes] = await Promise.all([
        eventsApi.getTables(event.id),
        tableBookingApi.getMyLocks(event.id),
      ]);
      setTablesData(tablesRes.data);
      if (locksRes.data.length > 0) setTableLock(locksRes.data[0]);
      setStep('select-table');
    } else if (event.layoutMode === 'Open') {
      setStep('capacity');
    }
  };

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

  // Grid: proceed to checkout — create booking to get clientSecret
  const handleProceedToCheckout = async () => {
    if (!tableLock || !event) return;
    setConfirming(true);
    setCheckoutError(null);
    try {
      const { data: booking } = await bookingsApi.create({
        eventId: event.id,
        tableId: tableLock.tableId,
      });
      setBookingId(booking.id);
      setClientSecret(booking.clientSecret ?? null);
      setStep('checkout');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setCheckoutError(axiosErr?.response?.data?.message ?? 'Failed to create booking');
    } finally {
      setConfirming(false);
    }
  };

  // After Stripe payment succeeds client-side, confirm on backend
  const handlePaymentSuccess = async () => {
    if (!bookingId) return;
    try {
      await bookingsApi.confirmPayment(bookingId);
      message.success('Booking confirmed!');
      navigate('/bookings');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setCheckoutError(axiosErr?.response?.data?.message ?? 'Failed to confirm booking');
      setConfirming(false);
    }
  };

  const handleCancelLock = async () => {
    if (!event || !tableLock) return;
    // Cancel pending booking if one exists
    if (bookingId) {
      try { await bookingsApi.cancel(bookingId); } catch { /* ignore */ }
    }
    try {
      await tableBookingApi.releaseTable(event.id, tableLock.tableId);
    } catch { /* ignore release errors */ }
    setTableLock(null);
    setCheckoutError(null);
    setClientSecret(null);
    setBookingId(null);
    if (step === 'checkout') {
      setStep('select-table');
    }
    await loadTables();
  };

  const handleLockExpired = () => {
    message.warning('Your table reservation has expired');
    setTableLock(null);
    setCheckoutError(null);
    setClientSecret(null);
    setBookingId(null);
    if (step === 'checkout') {
      setStep('select-table');
    }
    void loadTables();
  };

  const handleCapacityProceed = (seats: number) => {
    setSeatCount(seats);
    setCheckoutError(null);
    setStep('checkout-open');
  };

  // Open: create booking when entering checkout to get clientSecret
  useEffect(() => {
    if (step !== 'checkout-open' || !event || clientSecret) return;

    const createBooking = async () => {
      setConfirming(true);
      setCheckoutError(null);
      try {
        const { data: booking } = await bookingsApi.create({
          eventId: event.id,
          seatsReserved: seatCount,
        });
        setBookingId(booking.id);
        setClientSecret(booking.clientSecret ?? null);
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setCheckoutError(axiosErr?.response?.data?.message ?? 'Failed to create booking');
        setStep('capacity');
      } finally {
        setConfirming(false);
      }
    };
    void createBooking();
  }, [step, event, seatCount, clientSecret]);

  const handleCancelOpen = () => {
    setCheckoutError(null);
    setClientSecret(null);
    setBookingId(null);
    setStep('capacity');
  };

  if (loading) return <LoadingSpinner />;
  if (!event) return null;

  const feeCents = event.platformFeeCents ?? 1500;
  const lockedTableFromGrid = tablesData?.tables.find((t) => t.isLockedByYou) ?? null;

  // Table selection view
  if (step === 'select-table' && tablesData) {
    return (
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
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
          lockingTableId={lockingTableId}
          onLockExpired={handleLockExpired}
        />
      </Space>
    );
  }

  // Checkout view (Grid)
  if (step === 'checkout' && tableLock) {
    return (
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleCancelLock}>
          Back to Table Selection
        </Button>
        <Typography.Title level={3}>Complete Your Booking &mdash; {event.title}</Typography.Title>
        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} sm={16} md={12} lg={8}>
            <CheckoutPanel
              mode="grid"
              tableLock={tableLock}
              platformFeeCents={tableLock.platformFeeCents}
              confirming={confirming}
              setConfirming={setConfirming}
              error={checkoutError}
              clientSecret={clientSecret}
              stripePromise={stripePromiseRef.current}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={handleCancelLock}
              onExpired={handleLockExpired}
            />
          </Col>
        </Row>
      </Space>
    );
  }

  // Capacity seat selection view (Open)
  if (step === 'capacity') {
    return (
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => setStep('info')}>
          Back to Event
        </Button>
        <Typography.Title level={3}>Reserve Seats &mdash; {event.title}</Typography.Title>
        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} sm={16} md={12} lg={8}>
            <CapacityBookingForm
              maxCapacity={event.maxCapacity ?? 0}
              totalSold={event.quantitySold}
              pricePerPersonCents={event.pricePerPersonCents ?? 0}
              platformFeeCents={feeCents}
              onProceed={handleCapacityProceed}
            />
          </Col>
        </Row>
      </Space>
    );
  }

  // Checkout confirmation view (Open)
  if (step === 'checkout-open') {
    return (
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleCancelOpen}>
          Back to Seat Selection
        </Button>
        <Typography.Title level={3}>Complete Your Booking &mdash; {event.title}</Typography.Title>
        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} sm={16} md={12} lg={8}>
            <CheckoutPanel
              mode="open"
              seatCount={seatCount}
              pricePerPersonCents={event.pricePerPersonCents ?? 0}
              platformFeeCents={feeCents}
              confirming={confirming}
              setConfirming={setConfirming}
              error={checkoutError}
              clientSecret={clientSecret}
              stripePromise={stripePromiseRef.current}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={handleCancelOpen}
            />
          </Col>
        </Row>
      </Space>
    );
  }

  // Default: event info view
  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/events')}>
        All Events
      </Button>
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
        <Col xs={24} lg={16}>
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
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

        <Col xs={24} lg={8}>
          <Card title="Booking" styles={{ header: { borderBottom: 'none' } }}>
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
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
