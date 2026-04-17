import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Row, Col, Button, App, Skeleton } from 'antd';
import { Helmet } from 'react-helmet-async';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';

import { createLogger } from '@code829/shared/lib/logger';
import { eventsApi, tableBookingApi, bookingsApi } from '../../services/api';
import type { EventDetail, EventTableDto, EventTablesResponse, EventTicketType } from '@code829/shared/types/event';

const log = createLogger('Public/EventDetailPage');
import type { TableLock } from '@code829/shared/types/layout';
import type { PricingQuoteRequest } from '@code829/shared/types/pricing';
import { useAuth } from '@code829/shared/hooks/useAuth';
import { useAuthStore } from '@code829/shared/stores/authStore';
import { useBookingQuote } from '@code829/shared/hooks/useBookingQuote';

import EventHero from './components/EventHero';
import EventAbout from './components/EventAbout';
import EventSidebar from './components/EventSidebar';
import SelectTableStep from './steps/SelectTableStep';
import CapacityStep from './steps/CapacityStep';
import CheckoutStep from './steps/CheckoutStep';

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

const VALID_STEPS: BookingStep[] = ['info', 'select-table', 'checkout', 'capacity', 'checkout-open'];

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const storeToken = useAuthStore((s) => s.token);
  const tokenRef = useRef(storeToken);
  tokenRef.current = storeToken;
  const isMobile = useIsMobile();

  // Event detail requires auth (Q3 = b). Redirect anonymous visitors to /login as soon as
  // the session-cookie probe has finished and decided they're not signed in. Waiting on
  // isHydrated is what prevents a valid session-cookie refresh from bouncing to /login.
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?returnUrl=${returnUrl}`, { replace: true });
    }
  }, [isHydrated, isAuthenticated, navigate]);

  // Booking flow state — step lives in the URL so browser back and refresh both work
  const rawStep = searchParams.get('step');
  const step: BookingStep = (rawStep && VALID_STEPS.includes(rawStep as BookingStep))
    ? rawStep as BookingStep
    : 'info';
  const setStep = (next: BookingStep) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      if (next === 'info') params.delete('step');
      else params.set('step', next);
      return params;
    }, { replace: false });
  };
  const [tablesData, setTablesData] = useState<EventTablesResponse | null>(null);
  const [tableLocks, setTableLocks] = useState<TableLock[]>([]);
  const [lockingTableId, setLockingTableId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [seatCount, setSeatCount] = useState(1);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string | undefined>(undefined);
  const [ticketTypes, setTicketTypes] = useState<EventTicketType[]>([]);
  const [ticketTypesLoading, setTicketTypesLoading] = useState(false);

  // Stripe state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const bookingIdParam = searchParams.get('bookingId');
  const [bookingId, setBookingIdState] = useState<string | null>(bookingIdParam);
  const setBookingId = (next: string | null) => {
    setBookingIdState(next);
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      if (next) params.set('bookingId', next);
      else params.delete('bookingId');
      return params;
    }, { replace: true });
  };
  const stripePromiseRef = useRef<Promise<Stripe | null> | null>(null);
  const [paymentUnavailable, setPaymentUnavailable] = useState(false);
  const [isStartingBooking, setIsStartingBooking] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Backend-authoritative pricing quote — never compute totals in the browser.
  // Memoized so an unrelated re-render doesn't fire a new /bookings/quote request.
  const quoteSelection: PricingQuoteRequest | null = useMemo(() => {
    if (!event) return null;
    if (step === 'checkout' && tableLocks.length > 0) {
      return { eventId: event.id, tableIds: tableLocks.map(l => l.tableId) };
    }
    if (step === 'checkout-open' && seatCount > 0) {
      return { eventId: event.id, seatCount, eventTicketTypeId: selectedTicketTypeId };
    }
    return null;
  }, [event, step, tableLocks, seatCount, selectedTicketTypeId]);
  const { quote, isLoading: quoteLoading, error: quoteError } = useBookingQuote(quoteSelection);

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

  // Per-step cleanup: when the user navigates back (browser back button changes `step` in the URL)
  // away from a critical step, release any held locks and cancel pending bookings server-side.
  // Cancellation is best-effort via the regular (non-beacon) APIs so we see errors in logs.
  const prevStepRef = useRef<BookingStep>(step);
  useEffect(() => {
    const prev = prevStepRef.current;
    prevStepRef.current = step;
    if (prev === step) return;

    // Left select-table or checkout while still holding a locks-based booking
    const leftLockFlow = (prev === 'select-table' || prev === 'checkout') && step !== 'checkout';
    if (leftLockFlow && event) {
      const bid = bookingIdRef.current;
      const locks = tableLocksRef.current;
      void (async () => {
        if (bid) {
          try { await bookingsApi.cancel(bid); }
          catch (err) { log.warn('Step-change cleanup: cancel booking failed', { bid, err }); }
        }
        for (const lock of locks) {
          try { await tableBookingApi.releaseTable(event.id, lock.tableId); }
          catch (err) { log.warn('Step-change cleanup: release table failed', { tableId: lock.tableId, err }); }
        }
      })();
      setTableLocks([]);
      setClientSecret(null);
      if (bid) setBookingIdState(null);
    }

    // Left checkout-open with a pending booking
    if (prev === 'checkout-open' && step !== 'checkout-open') {
      const bid = bookingIdRef.current;
      if (bid) {
        void (async () => {
          try { await bookingsApi.cancel(bid); }
          catch (err) { log.warn('Step-change cleanup: cancel open booking failed', { bid, err }); }
        })();
        setClientSecret(null);
        setBookingIdState(null);
      }
    }
  }, [step, event]);

  // Hide the sticky mobile CTA when the virtual keyboard is open so it can't cover an input.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      // Keyboard typically reduces viewport height by >150px on mobile
      setIsKeyboardOpen(vv.height < window.innerHeight - 150);
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  // Load Stripe publishable key once — no silent fallback; block checkout if unavailable.
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await bookingsApi.getStripeConfig();
        if (!data.publishableKey) {
          log.error('Stripe config missing publishable key');
          setPaymentUnavailable(true);
          return;
        }
        stripePromiseRef.current = loadStripe(data.publishableKey);
        setPaymentUnavailable(false);
      } catch (err) {
        log.error('Failed to load Stripe config', { err });
        setPaymentUnavailable(true);
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

  // Restore booking context when landing on checkout via refresh or deep link.
  useEffect(() => {
    if (!bookingIdParam || clientSecret) return;
    if (step !== 'checkout' && step !== 'checkout-open') return;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await bookingsApi.getById(bookingIdParam);
        if (cancelled) return;
        if (data.status !== 'Pending') {
          // Stale booking — start over on the info step
          setSearchParams(new URLSearchParams(), { replace: true });
          setBookingIdState(null);
          return;
        }
        setBookingIdState(data.id);
        setClientSecret(data.clientSecret ?? null);
      } catch (err) {
        log.warn('Failed to restore booking from URL', { bookingIdParam, err });
        setSearchParams(new URLSearchParams(), { replace: true });
        setBookingIdState(null);
      }
    })();
    return () => { cancelled = true; };
  }, [bookingIdParam, clientSecret, step, setSearchParams]);

  // Load ticket types for Open events.
  // If the endpoint returns 5xx we show a user-visible error so we don't silently fall back
  // to the "no ticket types" state and let them try to book an event that actually requires one.
  const [ticketTypesError, setTicketTypesError] = useState(false);
  useEffect(() => {
    if (!event || event.layoutMode !== 'Open') return;
    setTicketTypesLoading(true);
    const loadTicketTypes = async () => {
      try {
        const { data } = await eventsApi.getTicketTypes(event.id);
        setTicketTypes(data.ticketTypes);
        setTicketTypesError(false);
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          log.info('Event has no ticket types', { eventId: event.id });
          setTicketTypes([]);
          setTicketTypesError(false);
        } else {
          log.error('Failed to load ticket types', { eventId: event.id, err });
          setTicketTypes([]);
          setTicketTypesError(true);
        }
      } finally {
        setTicketTypesLoading(false);
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
    if (isStartingBooking) return; // guard against mobile double-tap
    if (paymentUnavailable) {
      message.error('Payment service is currently unavailable. Please try again in a moment.');
      return;
    }
    if (ticketTypesError) {
      message.error('Ticket types are unavailable. Please refresh the page and try again.');
      return;
    }
    // Auth is enforced by the top-level redirect effect above; by the time the user can
    // click Book Now they're guaranteed to be signed in.
    if (!event) return;

    setIsStartingBooking(true);
    try {
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
    } catch (err) {
      log.error('Failed to start booking', { err });
      message.error('Could not start booking — please try again');
    } finally {
      setIsStartingBooking(false);
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
    } catch (err) {
      // Lock will expire server-side if we can't release it now
      log.warn('Failed to release table lock', { tableId: table.id, err });
      setTableLocks(prev => prev.filter(l => l.tableId !== table.id));
    }
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
      try { await bookingsApi.cancel(bookingId); }
      catch (err) { log.warn('Failed to cancel booking during lock cleanup', { bookingId, err }); }
    }
    for (const lock of tableLocks) {
      try {
        await tableBookingApi.releaseTable(event.id, lock.tableId);
      } catch (err) {
        log.warn('Failed to release table lock during cleanup', { tableId: lock.tableId, err });
      }
    }
    setTableLocks([]);
    setCheckoutError(null);
    setClientSecret(null);
    setBookingId(null);
    if (step === 'checkout') setStep('select-table');
    await loadTables();
  };

  const handleLockExpired = () => {
    message.warning('Your table reservation has expired');
    setTableLocks([]);
    setCheckoutError(null);
    setClientSecret(null);
    setBookingId(null);
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
      try { await bookingsApi.cancel(bookingId); }
      catch (err) { log.warn('Failed to cancel booking during cleanup', { bookingId, err }); }
    }
    setCheckoutError(null);
    setClientSecret(null);
    setBookingId(null);
    setStep('capacity');
  };

  if (loading) {
    return (
      <div className="page-container" style={{ paddingTop: isMobile ? 32 : 60 }}>
        <Skeleton.Image active style={{ width: '100%', height: isMobile ? 200 : 340, borderRadius: 16 }} />
        <Row gutter={isMobile ? [24, 24] : [60, 60]} style={{ marginTop: 40 }}>
          <Col xs={24} lg={15}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Col>
          <Col xs={24} lg={9}>
            <Skeleton active title paragraph={{ rows: 3 }} style={{ marginBottom: 24 }} />
            <Skeleton.Button active block style={{ height: 72 }} />
          </Col>
        </Row>
      </div>
    );
  }
  if (!event) return null;

  const lockedTablesFromGrid = tablesData?.tables.filter((t) => t.isLockedByYou) ?? [];

  if (step === 'select-table') {
    return (
      <SelectTableStep
        event={event}
        tablesData={tablesData}
        lockingTableId={lockingTableId}
        lockedTables={lockedTablesFromGrid}
        onLockTable={handleLockTable}
        onUnlockTable={handleUnlockTable}
        onProceedToCheckout={handleProceedToCheckout}
        onLockExpired={handleLockExpired}
        onBack={() => { void handleCancelLock(); setStep('info'); }}
      />
    );
  }

  if (step === 'checkout' && tableLocks.length > 0) {
    return (
      <CheckoutStep
        mode="grid"
        event={event}
        tableLocks={tableLocks}
        confirming={confirming}
        setConfirming={setConfirming}
        error={checkoutError}
        clientSecret={clientSecret}
        stripePromise={stripePromiseRef.current}
        quote={quote}
        quoteLoading={quoteLoading}
        quoteError={quoteError}
        onPaymentSuccess={handlePaymentSuccess}
        onCancel={handleCancelLock}
        onExpired={handleLockExpired}
      />
    );
  }

  if (step === 'capacity') {
    return (
      <CapacityStep
        event={event}
        ticketTypes={ticketTypes}
        ticketTypesLoading={ticketTypesLoading}
        onProceed={handleCapacityProceed}
        onBack={() => setStep('info')}
      />
    );
  }

  if (step === 'checkout-open') {
    return (
      <CheckoutStep
        mode="open"
        event={event}
        seatCount={seatCount}
        confirming={confirming}
        setConfirming={setConfirming}
        error={checkoutError}
        clientSecret={clientSecret}
        stripePromise={stripePromiseRef.current}
        quote={quote}
        quoteLoading={quoteLoading}
        quoteError={quoteError}
        onPaymentSuccess={handlePaymentSuccess}
        onCancel={handleCancelOpen}
      />
    );
  }

  const isSoldOut = event.isSoldOut ?? false;
  const remaining = event.availableCount ?? 0;

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
              isStartingBooking={isStartingBooking}
              itemVariants={itemVariants}
            />
          </Col>
        </Row>
      </div>

      {isMobile && !isSoldOut && step === 'info' && !isKeyboardOpen && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--bottom-nav-height, 65px) + 12px)',
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
              boxShadow: 'var(--card-shadow)',
              border: '1px solid var(--primary-soft)',
              background: 'var(--nav-bg)',
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>From</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>
                {event.displayFromFormatted ?? 'Free'}
              </div>
            </div>
            <Button
              type="primary"
              onClick={handleBookNow}
              loading={isStartingBooking}
              disabled={isStartingBooking || paymentUnavailable}
              style={{
                height: 48,
                padding: '0 32px',
                borderRadius: 14,
                fontWeight: 800,
                fontSize: 16,
                background: 'var(--gradient-brand)',
                border: 'none',
                boxShadow: 'var(--shadow-hover)'
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
