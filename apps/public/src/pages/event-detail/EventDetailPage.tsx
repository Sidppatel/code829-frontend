import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Typography, Row, Col, Button, Space, App } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Helmet } from 'react-helmet-async';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';

import { createLogger } from '@code829/shared/lib/logger';
import { eventsApi, tableBookingApi, bookingsApi } from '../../services/api';
import type { EventDetail, EventTableDto, EventTablesResponse, EventTicketType } from '@code829/shared/types/event';

const log = createLogger('Public/EventDetailPage');
import type { TableLock } from '@code829/shared/types/layout';
import { centsToUSD } from '@code829/shared/utils/currency';
import { useAuth } from '@code829/shared/hooks/useAuth';
import { useAuthStore } from '@code829/shared/stores/authStore';

import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import TableSelectionCanvas from '../../components/booking/TableSelectionCanvas';
import CheckoutPanel from '../../components/booking/CheckoutPanel';
import CapacityBookingForm from '../../components/booking/CapacityBookingForm';

import EventHero from './components/EventHero';
import EventAbout from './components/EventAbout';
import EventSidebar from './components/EventSidebar';

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
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }
  }
};

type BookingStep = 'info' | 'select-table' | 'checkout' | 'capacity' | 'checkout-open';

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const storeToken = useAuthStore((s) => s.token);
  const tokenRef = useRef(storeToken);
  tokenRef.current = storeToken;
  const isMobile = useIsMobile();

  // Booking flow state
  const [step, setStep] = useState<BookingStep>('info');
  const [tablesData, setTablesData] = useState<EventTablesResponse | null>(null);
  const [tableLocks, setTableLocks] = useState<TableLock[]>([]);
  const [lockingTableId, setLockingTableId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [seatCount, setSeatCount] = useState(1);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string | undefined>(undefined);
  const [ticketTypes, setTicketTypes] = useState<EventTicketType[]>([]);

  // Stripe state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [taxAmountCents, setTaxAmountCents] = useState<number | null>(null);
  const stripePromiseRef = useRef<Promise<Stripe | null> | null>(null);
  const [paymentMode, setPaymentMode] = useState<'live' | 'mock'>('live');

  // Refs for cleanup
  const tableLocksRef = useRef<TableLock[]>([]);
  const eventRef = useRef<EventDetail | null>(null);
  const bookingIdRef = useRef<string | null>(null);

  useEffect(() => { tableLocksRef.current = tableLocks; }, [tableLocks]);
  useEffect(() => { eventRef.current = event; }, [event]);
  useEffect(() => { bookingIdRef.current = bookingId; }, [bookingId]);

  // Release table lock and cancel pending booking on page leave
  useEffect(() => {
    const cleanup = () => {
      const apiUrl = import.meta.env.VITE_API_URL ?? '';
      const jwt = tokenRef.current;
      if (!jwt) return;

      // Cancel pending booking (also releases table lock via sp_cancel_booking)
      const bid = bookingIdRef.current;
      if (bid) {
        const payload = JSON.stringify({ bookingId: bid, token: jwt });
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(`${apiUrl}/bookings/cancel-beacon`, blob);
        return; // sp_cancel_booking handles the table release
      }

      // No booking yet — just release all table locks if held
      const locks = tableLocksRef.current;
      const ev = eventRef.current;
      if (locks.length > 0 && ev) {
        for (const lock of locks) {
          const payload = JSON.stringify({ eventId: ev.id, tableId: lock.tableId, token: jwt });
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon(`${apiUrl}/tables/release-beacon`, blob);
        }
      }
    };

    const handleBeforeUnload = () => { cleanup(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanup();
    };
  }, []);

  // Load Stripe publishable key once
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await bookingsApi.getStripeConfig();
        setPaymentMode(data.mode);
        if (data.mode === 'live' && data.publishableKey) {
          stripePromiseRef.current = loadStripe(data.publishableKey);
        }
      } catch {
        // Stripe not configured — fall back to mock
        setPaymentMode('mock');
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
        log.info('Loaded event', { slug, id: data.id });
      } catch (err) {
        log.error('Failed to load event', { slug, err });
        message.error('Event not found');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [slug, message, navigate]);

  // Load ticket types for Open events
  useEffect(() => {
    if (!event || event.layoutMode !== 'Open') return;
    const loadTicketTypes = async () => {
      try {
        const { data } = await eventsApi.getTicketTypes(event.id);
        setTicketTypes(data.ticketTypes);
      } catch {
        // Event may not have ticket types — that's OK
        setTicketTypes([]);
      }
    };
    void loadTicketTypes();
  }, [event]);

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
      if (locksRes.data.length > 0) setTableLocks(locksRes.data);
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
      setTableLocks(prev => [...prev, data]);
      setCheckoutError(null);
      await loadTables();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      message.error(axiosErr?.response?.data?.message ?? 'Failed to reserve table');
    } finally {
      setLockingTableId(null);
    }
  };

  const handleUnlockTable = async (table: EventTableDto) => {
    if (!event) return;
    try {
      await tableBookingApi.releaseTable(event.id, table.id);
      setTableLocks(prev => prev.filter(l => l.tableId !== table.id));
      await loadTables();
    } catch { /* ignore */ }
  };

  const handleProceedToCheckout = async () => {
    if (tableLocks.length === 0 || !event) return;
    setConfirming(true);
    setCheckoutError(null);
    try {
      const { data: booking } = await bookingsApi.create({
        eventId: event.id,
        tableIds: tableLocks.map(l => l.tableId),
      });
      setBookingId(booking.id);
      setClientSecret(booking.clientSecret ?? null);
      setTaxAmountCents(booking.transaction?.taxAmountCents ?? null);
      setStep('checkout');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setCheckoutError(axiosErr?.response?.data?.message ?? 'Failed to create booking');
    } finally {
      setConfirming(false);
    }
  };

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
    if (!event) return;
    if (bookingId) {
      try { await bookingsApi.cancel(bookingId); } catch { /* ignore */ }
    }
    for (const lock of tableLocks) {
      try {
        await tableBookingApi.releaseTable(event.id, lock.tableId);
      } catch { /* ignore */ }
    }
    setTableLocks([]);
    setCheckoutError(null);
    setClientSecret(null);
    setBookingId(null);
    setTaxAmountCents(null);
    if (step === 'checkout') setStep('select-table');
    await loadTables();
  };

  const handleLockExpired = () => {
    message.warning('Your table reservation has expired');
    setTableLocks([]);
    setCheckoutError(null);
    setClientSecret(null);
    setBookingId(null);
    setTaxAmountCents(null);
    if (step === 'checkout') setStep('select-table');
    void loadTables();
  };

  const handleCapacityProceed = (seats: number, ticketTypeId?: string) => {
    setSeatCount(seats);
    setSelectedTicketTypeId(ticketTypeId);
    setCheckoutError(null);
    setStep('checkout-open');
  };

  useEffect(() => {
    if (step !== 'checkout-open' || !event || clientSecret) return;
    const createBooking = async () => {
      setConfirming(true);
      setCheckoutError(null);
      try {
        const { data: booking } = await bookingsApi.create({
          eventId: event.id,
          seatsReserved: seatCount,
          ...(selectedTicketTypeId ? { eventTicketTypeId: selectedTicketTypeId } : {}),
        });
        setBookingId(booking.id);
        setClientSecret(booking.clientSecret ?? null);
        setTaxAmountCents(booking.transaction?.taxAmountCents ?? null);
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setCheckoutError(axiosErr?.response?.data?.message ?? 'Failed to create booking');
        setStep('capacity');
      } finally {
        setConfirming(false);
      }
    };
    void createBooking();
  }, [step, event, seatCount, selectedTicketTypeId, clientSecret]);

  const handleCancelOpen = async () => {
    if (bookingId) {
      try { await bookingsApi.cancel(bookingId); } catch { /* ignore */ }
    }
    setCheckoutError(null);
    setClientSecret(null);
    setBookingId(null);
    setTaxAmountCents(null);
    setStep('capacity');
  };

  if (loading) return <LoadingSpinner />;
  if (!event) return null;

  const lockedTablesFromGrid = tablesData?.tables.filter((t) => t.isLockedByYou) ?? [];

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
          lockedTables={lockedTablesFromGrid}
          onLockTable={handleLockTable}
          onUnlockTable={handleUnlockTable}
          onProceedToCheckout={handleProceedToCheckout}
          lockingTableId={lockingTableId}
          onLockExpired={handleLockExpired}
        />
      </Space>
    );
  }

  if (step === 'checkout' && tableLocks.length > 0) {
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
              tableLocks={tableLocks}
              confirming={confirming}
              setConfirming={setConfirming}
              error={checkoutError}
              clientSecret={clientSecret}
              stripePromise={stripePromiseRef.current}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={handleCancelLock}
              onExpired={handleLockExpired}
              taxAmountCents={taxAmountCents}
              paymentMode={paymentMode}
            />
          </Col>
        </Row>
      </Space>
    );
  }

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
              pricePerPersonCents={event.displayPricePerPersonCents ?? event.pricePerPersonCents ?? 0}
              ticketTypes={ticketTypes.length > 0 ? ticketTypes : undefined}
              onProceed={handleCapacityProceed}
            />
          </Col>
        </Row>
      </Space>
    );
  }

  if (step === 'checkout-open') {
    const selectedType = selectedTicketTypeId
      ? ticketTypes.find(tt => tt.id === selectedTicketTypeId)
      : undefined;
    const checkoutPrice = selectedType?.displayPriceCents ?? event.displayPricePerPersonCents ?? event.pricePerPersonCents ?? 0;

    return (
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => void handleCancelOpen()}>
          Back to Seat Selection
        </Button>
        <Typography.Title level={3}>Complete Your Booking &mdash; {event.title}</Typography.Title>
        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} sm={16} md={12} lg={8}>
            <CheckoutPanel
              mode="open"
              seatCount={seatCount}
              pricePerPersonCents={checkoutPrice}
              confirming={confirming}
              setConfirming={setConfirming}
              error={checkoutError}
              clientSecret={clientSecret}
              stripePromise={stripePromiseRef.current}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={handleCancelOpen}
              taxAmountCents={taxAmountCents}
              paymentMode={paymentMode}
            />
          </Col>
        </Row>
      </Space>
    );
  }

  const capacity = event.layoutMode === 'Open' ? ((event.totalCapacity && event.totalCapacity > 0) ? event.totalCapacity : (event.maxCapacity ?? 0)) : 0;
  const remaining = capacity - (event.totalSold ?? 0);
  const isSoldOut = event.layoutMode === 'Open' && remaining <= 0;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={containerVariants}
      style={{ paddingBottom: 150, minHeight: '100vh', position: 'relative' }}
    >
      <Helmet><title>{event?.title ?? 'Event'} - Code829</title></Helmet>
      <EventHero event={event} itemVariants={itemVariants} />

      <div className="page-container" style={{ marginTop: isMobile ? 32 : 60 }}>
        <Row gutter={isMobile ? [24, 24] : [60, 60]}>
          <Col xs={24} lg={15}>
            <EventAbout event={event} itemVariants={itemVariants} />
          </Col>
          <Col xs={24} lg={9}>
            <EventSidebar 
              event={event} 
              isSoldOut={isSoldOut} 
              remaining={remaining}
              handleBookNow={handleBookNow}
              itemVariants={itemVariants} 
            />
          </Col>
        </Row>
      </div>

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
                {(event.displayMinPricePerTableCents ?? event.displayPricePerPersonCents ?? event.minPricePerTableCents ?? event.pricePerPersonCents) ? centsToUSD((event.displayMinPricePerTableCents ?? event.displayPricePerPersonCents ?? event.minPricePerTableCents ?? event.pricePerPersonCents)!) : 'Free'}
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
