import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Typography, Row, Col, Tag, Button, Space, App,
} from 'antd';
import {
  CalendarOutlined, EnvironmentOutlined, ArrowLeftOutlined, ShareAltOutlined, MessageOutlined,
} from '@ant-design/icons';
import { useIsMobile } from '../../hooks/useIsMobile';

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};
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
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

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
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
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
              totalSold={event.totalSold}
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

  const capacity = event.layoutMode === 'Open' ? ((event.totalCapacity && event.totalCapacity > 0) ? event.totalCapacity : (event.maxCapacity ?? 0)) : 0;
  const remaining = capacity - (event.totalSold ?? 0);
  const isSoldOut = event.layoutMode === 'Open' && remaining <= 0;



  // Default: event info view
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={containerVariants}
      style={{ paddingBottom: 150, minHeight: '100vh', position: 'relative' }}
    >
      {/* Immersive Event Header */}
      <section style={{ position: 'relative', width: '100%', height: isMobile ? '55vh' : '65vh', minHeight: isMobile ? 380 : 450, overflow: 'hidden' }}>
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, var(--accent-violet-dark), var(--bg-elevated))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CalendarOutlined style={{ fontSize: 120, color: 'rgba(255,255,255,0.05)' }} />
          </div>
        )}

        {/* Overlay for Header */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(11, 14, 20, 0.4) 0%, rgba(11, 14, 20, 0.95) 90%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          paddingBottom: isMobile ? 40 : 80,
        }}>
          <div className="page-container">
            <motion.div variants={itemVariants}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: isMobile ? 12 : 24,
                marginBottom: isMobile ? 32 : 48,
                width: '100%',
                paddingInline: isMobile ? 4 : 0
              }}>
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/events')}
                  style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontWeight: 600,
                    fontSize: isMobile ? 14 : 15,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {isMobile ? 'Back' : 'Back to Collection'}
                </Button>

                <Space size={isMobile ? 8 : 12}>
                  <Tag style={{ 
                    borderRadius: 10, 
                    border: 'none', 
                    background: 'var(--accent-violet)', 
                    color: '#fff', 
                    fontWeight: 800, 
                    padding: isMobile ? '2px 12px' : '4px 18px',
                    margin: 0
                  }}>
                    {event.category}
                  </Tag>
                  {event.isFeatured && (
                    <Tag style={{ 
                      borderRadius: 10, 
                      border: 'none', 
                      background: 'var(--accent-gold)', 
                      color: '#000', 
                      fontWeight: 800, 
                      padding: isMobile ? '2px 12px' : '4px 18px',
                      margin: 0
                    }}>
                      Featured
                    </Tag>
                  )}
                </Space>
              </div>

              <h1 style={{
                fontSize: isMobile ? 'clamp(1.8rem, 10vw, 3rem)' : 'clamp(2.5rem, 8vw, 6rem)',
                fontWeight: 900,
                color: '#fff',
                marginBottom: isMobile ? 16 : 24,
                letterSpacing: '-0.06em',
                lineHeight: 1
              }}>
                {event.title}
              </h1>

              <Space direction={isMobile ? 'vertical' : 'horizontal'} size={isMobile ? 8 : 40} style={{ color: 'rgba(255,255,255,0.9)', fontSize: isMobile ? 14 : 16, fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CalendarOutlined style={{ color: 'var(--accent-rose)' }} />
                  {formatDateRange(event.startDate, event.endDate)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <EnvironmentOutlined style={{ color: 'var(--accent-violet)' }} />
                  {event.venue.name}, {event.venue.city}
                </span>
              </Space>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="page-container" style={{ marginTop: isMobile ? 32 : 60 }}>
        <Row gutter={isMobile ? [24, 24] : [60, 60]}>
          {/* Main Content */}
          <Col xs={24} lg={15}>
            <motion.div variants={itemVariants}>
              <div style={{ marginBottom: 80 }}>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 6, height: 32, background: 'var(--accent-violet)', borderRadius: 10 }} />
                  About the Experience
                </h3>
                <div style={{
                  fontSize: isMobile ? 16 : 18,
                  lineHeight: 1.8,
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-surface)',
                  padding: isMobile ? 24 : 40,
                  borderRadius: 32,
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--card-shadow)'
                }}>
                  {event.description || 'No description provided for this exclusive event.'}
                </div>
              </div>

              <div style={{ marginBottom: 60 }}>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 6, height: 32, background: 'var(--accent-rose)', borderRadius: 10 }} />
                  Venue & Details
                </h3>
                <div className="glass-card" style={{ padding: isMobile ? 24 : 40, borderRadius: 32 }}>
                  <Row gutter={[32, 32]}>
                    <Col xs={24} md={12}>
                      <Typography.Text style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, fontSize: 11, display: 'block', marginBottom: 8 }}>Venue</Typography.Text>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{event.venue.name}</div>
                    </Col>
                    <Col xs={24} md={12}>
                      <Typography.Text style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, fontSize: 11, display: 'block', marginBottom: 8 }}>Address</Typography.Text>
                      <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)' }}>
                        {event.venue.address}, {event.venue.city}, {event.venue.state}
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            </motion.div>
          </Col>

          {/* Booking Sidebar */}
          <Col xs={24} lg={9}>
            <motion.div variants={itemVariants} style={{ position: isMobile ? 'relative' : 'sticky', top: isMobile ? 0 : 130 }}>
              <div className="glass-card" style={{ padding: isMobile ? '24px 32px' : 48, borderRadius: 32 }}>
                <div style={{ marginBottom: isMobile ? 24 : 40 }}>
                  <Typography.Text style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800, fontSize: 11 }}>Starting at</Typography.Text>
                  <div style={{
                    fontSize: isMobile ? 'clamp(24px, 8vw, 36px)' : 48,
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    marginTop: 8,
                    letterSpacing: '-1px',
                    lineHeight: 1.1
                  }}>
                    {event.pricePerPersonCents ? centsToUSD(event.pricePerPersonCents) : 'Complimentary'}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={handleBookNow}
                    disabled={isSoldOut}
                    style={{
                      height: 72,
                      borderRadius: 18,
                      fontSize: 18,
                      fontWeight: 800,
                      background: isSoldOut ? 'var(--bg-soft)' : 'linear-gradient(135deg, var(--accent-violet), var(--accent-rose))',
                      border: 'none',
                      boxShadow: isSoldOut ? 'none' : '0 15px 35px rgba(99, 102, 241, 0.35)',
                      color: isSoldOut ? 'var(--text-muted)' : 'white'
                    }}
                  >
                    {isSoldOut ? 'Sold Out' : 'Reserve tickets'}
                  </Button>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    color: 'var(--text-secondary)',
                    fontSize: 14,
                    fontWeight: 600
                  }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: !isSoldOut ? '#22c55e' : 'var(--accent-rose)'
                    }} />
                    {!isSoldOut
                      ? (event.layoutMode === 'Grid'
                        ? `${event.noOfAvailableTables} tables available`
                        : `${remaining} spots remaining`)
                      : 'Sold Out'}
                  </div>
                </div>

                <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
                  <Typography.Text style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', marginBottom: 20 }}>Spread the Word</Typography.Text>
                  <Space size={16}>
                    <Button shape="circle" icon={<ShareAltOutlined />} style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid var(--border)', background: 'transparent' }} className="hover-lift" />
                    <Button shape="circle" icon={<MessageOutlined />} style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid var(--border)', background: 'transparent' }} className="hover-lift" />
                  </Space>
                </div>
              </div>
            </motion.div>
          </Col>
        </Row>
      </div>

      {/* Mobile Sticky CTA */}
      {isMobile && !isSoldOut && step === 'info' && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(var(--bottom-nav-height, 65px) + 12px)',
          left: 16,
          right: 16,
          zIndex: 1000,
        }}>
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.5 }}
            className="glass-card"
            style={{
              padding: '12px 20px',
              borderRadius: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              border: '1px solid var(--primary-soft)',
              background: 'var(--nav-bg)',
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>From</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>
                {event.pricePerPersonCents ? centsToUSD(event.pricePerPersonCents) : 'Free'}
              </div>
            </div>
            <Button
              type="primary"
              onClick={handleBookNow}
              style={{
                height: 48,
                padding: '0 32px',
                borderRadius: 14,
                fontWeight: 800,
                fontSize: 16,
                background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-rose))',
                border: 'none',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
              }}
            >
              Reserve
            </Button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
