import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Row, Col, Button, App, Skeleton } from 'antd';
import { Helmet } from 'react-helmet-async';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';

import { createLogger } from '@code829/shared/lib/logger';
import { eventsApi, tablePurchaseApi, purchasesApi } from '../../services/api';
import type { EventDetail, EventTableDto, EventTablesResponse, EventTicketType } from '@code829/shared/types/event';

const log = createLogger('Public/EventDetailPage');
import type { TableLock } from '@code829/shared/types/layout';
import type { PricingQuoteRequest } from '@code829/shared/types/pricing';
import { useAuth } from '@code829/shared/hooks/useAuth';
import { useAuthStore } from '@code829/shared/stores/authStore';
import { useCheckoutQuote } from '@code829/shared/hooks/useCheckoutQuote';
import { centsToDollars } from '@code829/shared/utils/currency';

import EventHero from './components/EventHero';
import EventAbout from './components/EventAbout';
import EventSidebar from './components/EventSidebar';
import EventLineup from './components/EventLineup';
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

type PurchaseStep = 'info' | 'select-table' | 'checkout' | 'capacity' | 'checkout-open';

const VALID_STEPS: PurchaseStep[] = ['info', 'select-table', 'checkout', 'capacity', 'checkout-open'];

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isMobile = useIsMobile();

  const requireAuthOrRedirect = useCallback((): boolean => {
    if (!isHydrated) return false;
    if (isAuthenticated) return true;
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    navigate(`/login?returnUrl=${returnUrl}`, { replace: false });
    return false;
  }, [isHydrated, isAuthenticated, navigate]);

  const rawStep = searchParams.get('step');
  const step: PurchaseStep = (rawStep && VALID_STEPS.includes(rawStep as PurchaseStep))
    ? rawStep as PurchaseStep
    : 'info';
  const setStep = useCallback((next: PurchaseStep) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      if (next === 'info') params.delete('step');
      else params.set('step', next);
      return params;
    }, { replace: false });
  }, [setSearchParams]);
  const [tablesData, setTablesData] = useState<EventTablesResponse | null>(null);
  const [tableLocks, setTableLocks] = useState<TableLock[]>([]);
  const [lockingTableId, setLockingTableId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [seatCount, setSeatCount] = useState(1);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string | undefined>(undefined);
  const [ticketTypes, setTicketTypes] = useState<EventTicketType[]>([]);
  const [ticketTypesLoading, setTicketTypesLoading] = useState(false);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const purchaseIdParam = searchParams.get('purchaseId');
  const [purchaseId, setPurchaseIdState] = useState<string | null>(purchaseIdParam);
  const setPurchaseId = useCallback((next: string | null) => {
    setPurchaseIdState(next);
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      if (next) params.set('purchaseId', next);
      else params.delete('purchaseId');
      return params;
    }, { replace: true });
  }, [setSearchParams]);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [paymentUnavailable, setPaymentUnavailable] = useState(false);
  const [isStartingPurchase, setIsStartingPurchase] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    const footer = document.querySelector('.ui-footer--public');
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterVisible(entry.isIntersecting),
      { rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const quoteSelection: PricingQuoteRequest | null = useMemo(() => {
    if (!event) return null;
    if (step === 'checkout' && tableLocks.length > 0) {
      return { eventId: event.eventId, tableIds: tableLocks.map(l => l.tableId) };
    }
    if (step === 'checkout-open' && seatCount > 0) {
      return { eventId: event.eventId, seatCount, eventTicketTypeId: selectedTicketTypeId };
    }
    return null;
  }, [event, step, tableLocks, seatCount, selectedTicketTypeId]);
  const { quote, isLoading: quoteLoading, error: quoteError } = useCheckoutQuote(quoteSelection);

  const tableLocksRef = useRef<TableLock[]>([]);
  const eventRef = useRef<EventDetail | null>(null);
  const purchaseIdRef = useRef<string | null>(null);

  useEffect(() => { tableLocksRef.current = tableLocks; }, [tableLocks]);
  useEffect(() => { eventRef.current = event; }, [event]);
  useEffect(() => { purchaseIdRef.current = purchaseId; }, [purchaseId]);

  useEffect(() => {
    const cleanup = () => {
      const apiUrl = import.meta.env.VITE_API_URL ?? '';

      const bid = purchaseIdRef.current;
      if (bid) {
        const payload = JSON.stringify({ purchaseId: bid });
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(`${apiUrl}/purchases/cancel-beacon`, blob);
        return; // sp_cancel_booking handles the table release
      }

      const locks = tableLocksRef.current;
      const ev = eventRef.current;
      if (locks.length > 0 && ev) {
        for (const lock of locks) {
          const payload = JSON.stringify({ eventId: ev.eventId, tableId: lock.tableId });
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

  const prevStepRef = useRef<PurchaseStep>(step);
  useEffect(() => {
    const prev = prevStepRef.current;
    prevStepRef.current = step;
    if (prev === step) return;

    const leftLockFlow = (prev === 'select-table' || prev === 'checkout') && step !== 'checkout';
    if (leftLockFlow && event) {
      const bid = purchaseIdRef.current;
      const locks = tableLocksRef.current;
      void (async () => {
        if (bid) {
          try { await purchasesApi.cancel(bid); }
          catch (err) { log.warn('Step-change cleanup: cancel booking failed', { bid, err }); }
        }
        for (const lock of locks) {
          try { await tablePurchaseApi.releaseTable(event.eventId, lock.tableId); }
          catch (err) { log.warn('Step-change cleanup: release table failed', { tableId: lock.tableId, err }); }
        }
      })();
      setTableLocks([]);
      setClientSecret(null);
      if (bid) setPurchaseId(null);
    }

    if (prev === 'checkout-open' && step !== 'checkout-open') {
      const bid = purchaseIdRef.current;
      if (bid) {
        void (async () => {
          try { await purchasesApi.cancel(bid); }
          catch (err) { log.warn('Step-change cleanup: cancel open booking failed', { bid, err }); }
        })();
        setClientSecret(null);
        setPurchaseId(null);
      }
    }
  }, [step, event, setPurchaseId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      setIsKeyboardOpen(vv.height < window.innerHeight - 150);
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await purchasesApi.getStripeConfig();
        if (!data.publishableKey) {
          log.error('Stripe config missing publishable key');
          setPaymentUnavailable(true);
          return;
        }
        setStripePromise(loadStripe(data.publishableKey));
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
        log.info('Loaded event', { slug, eventId: data.eventId });
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

  useEffect(() => {
    if (!purchaseIdParam || clientSecret) return;
    if (step !== 'checkout' && step !== 'checkout-open') return;
    if (!requireAuthOrRedirect()) return;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await purchasesApi.getById(purchaseIdParam);
        if (cancelled) return;
        if (data.status !== 'Pending') {
          setSearchParams(new URLSearchParams(), { replace: true });
          setPurchaseIdState(null);
          return;
        }
        setPurchaseIdState(data.id);
        setClientSecret(data.clientSecret ?? null);
      } catch (err) {
        log.warn('Failed to restore booking from URL', { purchaseIdParam, err });
        setSearchParams(new URLSearchParams(), { replace: true });
        setPurchaseIdState(null);
      }
    })();
    return () => { cancelled = true; };
  }, [purchaseIdParam, clientSecret, step, setSearchParams, requireAuthOrRedirect]);

  const [ticketTypesError, setTicketTypesError] = useState(false);
  useEffect(() => {
    if (!event || event.layoutMode !== 'Open') return;
    const loadTicketTypes = async () => {
      setTicketTypesLoading(true);
      try {
        const { data } = await eventsApi.getTicketTypes(event.eventId);
        setTicketTypes(data.ticketTypes);
        setTicketTypesError(false);
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          log.info('Event has no ticket types', { eventId: event.eventId });
          setTicketTypes([]);
          setTicketTypesError(false);
        } else {
          log.error('Failed to load ticket types', { eventId: event.eventId, err });
          setTicketTypes([]);
          setTicketTypesError(true);
        }
      } finally {
        setTicketTypesLoading(false);
      }
    };
    void loadTicketTypes();
  }, [event]);

  useEffect(() => {
    if (!event || event.layoutMode !== 'Grid' || tablesData) return;
    if (step !== 'select-table' && step !== 'checkout') return;
    if (!requireAuthOrRedirect()) return;

    const restore = async () => {
      try {
        const [tablesRes, locksRes] = await Promise.all([
          eventsApi.getTables(event.eventId),
          tablePurchaseApi.getMyLocks(event.eventId),
        ]);
        setTablesData(tablesRes.data);
        if (locksRes.data.length > 0) setTableLocks(locksRes.data);
        log.info('Restored table selection state from refresh', { eventId: event.eventId, locks: locksRes.data.length });
      } catch (err) {
        log.error('Failed to restore table state on refresh', { eventId: event.eventId, err });
      }
    };
    void restore();
  }, [event, step, tablesData, requireAuthOrRedirect]);

  useEffect(() => {
    if (step === 'capacity') {
      requireAuthOrRedirect();
    }
  }, [step, requireAuthOrRedirect]);

  const loadTables = useCallback(async () => {
    if (!event) return;
    try {
      const { data } = await eventsApi.getTables(event.eventId);
      setTablesData(data);
    } catch {
      message.error('Failed to load table layout');
    }
  }, [event, message]);

  const handleBookNow = async () => {
    if (isStartingPurchase) return;
    if (paymentUnavailable) {
      message.error('Payment service is currently unavailable. Please try again in a moment.');
      return;
    }
    if (ticketTypesError) {
      message.error('Ticket types are unavailable. Please refresh the page and try again.');
      return;
    }
    if (!event) return;
    if (!requireAuthOrRedirect()) return;

    setIsStartingPurchase(true);
    try {
      if (event.layoutMode === 'Grid') {
        const [tablesRes, locksRes] = await Promise.all([
          eventsApi.getTables(event.eventId),
          tablePurchaseApi.getMyLocks(event.eventId),
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
      setIsStartingPurchase(false);
    }
  };

  const handleLockTable = async (table: EventTableDto) => {
    if (!event) return;
    if (!requireAuthOrRedirect()) return;
    setLockingTableId(table.id);
    try {
      const { data } = await tablePurchaseApi.lockTable(event.eventId, table.id);
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
    if (!requireAuthOrRedirect()) return;
    try {
      await tablePurchaseApi.releaseTable(event.eventId, table.id);
      setTableLocks(prev => prev.filter(l => l.tableId !== table.id));
      await loadTables();
    } catch (err) {
      log.warn('Failed to release table lock', { tableId: table.id, err });
      setTableLocks(prev => prev.filter(l => l.tableId !== table.id));
    }
  };

  const handleProceedToCheckout = async () => {
    if (tableLocks.length === 0 || !event) return;
    if (!requireAuthOrRedirect()) return;
    setConfirming(true);
    setCheckoutError(null);
    try {
      const { data: booking } = await purchasesApi.create({
        eventId: event.eventId,
        tableIds: tableLocks.map(l => l.tableId),
      });
      setPurchaseIdState(booking.id);
      setClientSecret(booking.clientSecret ?? null);
      setSearchParams(prev => {
        const params = new URLSearchParams(prev);
        params.set('purchaseId', booking.id);
        params.set('step', 'checkout');
        return params;
      }, { replace: false });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setCheckoutError(axiosErr?.response?.data?.message ?? 'Failed to create booking');
    } finally {
      setConfirming(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!purchaseId) return;
    try {
      const { data: current } = await purchasesApi.getById(purchaseId);
      if (current.status === 'Paid' || current.status === 'CheckedIn') {
        message.success('Booking confirmed!');
        navigate('/purchases');
        return;
      }
      if (current.status !== 'Pending') {
        setCheckoutError('This booking is no longer active. Please start a new purchase.');
        setConfirming(false);
        return;
      }
      await purchasesApi.confirmPayment(purchaseId);
      message.success('Booking confirmed!');
      navigate('/purchases');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setCheckoutError(axiosErr?.response?.data?.message ?? 'Failed to confirm booking');
      setConfirming(false);
    }
  };

  const handleCancelLock = async () => {
    if (!event) return;
    if (purchaseId) {
      try { await purchasesApi.cancel(purchaseId); }
      catch (err) { log.warn('Failed to cancel booking during lock cleanup', { purchaseId, err }); }
    }
    for (const lock of tableLocks) {
      try {
        await tablePurchaseApi.releaseTable(event.eventId, lock.tableId);
      } catch (err) {
        log.warn('Failed to release table lock during cleanup', { tableId: lock.tableId, err });
      }
    }
    setTableLocks([]);
    setCheckoutError(null);
    setClientSecret(null);
    setPurchaseId(null);
    if (step === 'checkout') setStep('select-table');
    await loadTables();
  };

  const handleLockExpired = () => {
    message.warning('Your table reservation has expired');
    setTableLocks([]);
    setCheckoutError(null);
    setClientSecret(null);
    setPurchaseId(null);
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
    if (!requireAuthOrRedirect()) return;
    const createPurchase = async () => {
      setConfirming(true);
      setCheckoutError(null);
      try {
        const { data: booking } = await purchasesApi.create({
          eventId: event.eventId,
          seatsReserved: seatCount,
          ...(selectedTicketTypeId ? { eventTicketTypeId: selectedTicketTypeId } : {}),
        });
        setPurchaseId(booking.id);
        setClientSecret(booking.clientSecret ?? null);
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setCheckoutError(axiosErr?.response?.data?.message ?? 'Failed to create booking');
        setStep('capacity');
      } finally {
        setConfirming(false);
      }
    };
    void createPurchase();
  }, [step, event, seatCount, selectedTicketTypeId, clientSecret, setPurchaseId, setStep, requireAuthOrRedirect]);

  const handleCancelOpen = async () => {
    if (purchaseId) {
      try { await purchasesApi.cancel(purchaseId); }
      catch (err) { log.warn('Failed to cancel booking during cleanup', { purchaseId, err }); }
    }
    setCheckoutError(null);
    setClientSecret(null);
    setPurchaseId(null);
    setSeatCount(0);
    setSelectedTicketTypeId(undefined);
    setStep('info');
  };

  const structuredData = useMemo(() => {
    if (!event) return null;

    const sd = {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": event.title,
      "startDate": event.startDate,
      "endDate": event.endDate,
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "eventStatus": event.status === 'Cancelled' ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
      "location": {
        "@type": "Place",
        "name": event.venue?.name,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": event.venue?.address,
          "addressLocality": event.venue?.city,
          "addressRegion": event.venue?.state,
          "postalCode": event.venue?.zipCode,
          "addressCountry": "US"
        }
      },
      "image": event.imageUrl ? [event.imageUrl] : undefined,
      "description": event.description,
      "organizer": event.organizerName ? {
        "@type": "Organization",
        "name": event.organizerName,
        "url": "https://code829.com"
      } : undefined,
      "offers": {
        "@type": "Offer",
        "url": `https://code829.com/events/${event.slug}`,
        "price": event.displayFromAmountCents ? centsToDollars(event.displayFromAmountCents).toFixed(2) : "0.00",
        "priceCurrency": "USD",
        "availability": event.isSoldOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
        "validFrom": event.publishedAt || event.createdAt
      }
    };
    return JSON.stringify(sd);
  }, [event]);

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
      <div className="page-container" style={{ paddingTop: isMobile ? 48 : 64 }}>
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
      </div>
    );
  }

  if (step === 'checkout' && tableLocks.length > 0) {
    return (
      <div className="page-container" style={{ paddingTop: isMobile ? 48 : 64 }}>
        <CheckoutStep
          mode="grid"
          event={event}
          tableLocks={tableLocks}
          confirming={confirming}
          setConfirming={setConfirming}
          error={checkoutError}
          clientSecret={clientSecret}
          stripePromise={stripePromise}
          quote={quote}
          quoteLoading={quoteLoading}
          quoteError={quoteError}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={handleCancelLock}
          onExpired={handleLockExpired}
        />
      </div>
    );
  }

  if (step === 'capacity') {
    return (
      <div className="page-container" style={{ paddingTop: isMobile ? 48 : 64 }}>
        <CapacityStep
          event={event}
          ticketTypes={ticketTypes}
          ticketTypesLoading={ticketTypesLoading}
          onProceed={handleCapacityProceed}
          onBack={() => setStep('info')}
        />
      </div>
    );
  }

  if (step === 'checkout-open') {
    return (
      <div className="page-container" style={{ paddingTop: isMobile ? 48 : 64 }}>
        <CheckoutStep
          mode="open"
          event={event}
          seatCount={seatCount}
          confirming={confirming}
          setConfirming={setConfirming}
          error={checkoutError}
          clientSecret={clientSecret}
          stripePromise={stripePromise}
          quote={quote}
          quoteLoading={quoteLoading}
          quoteError={quoteError}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={handleCancelOpen}
        />
      </div>
    );
  }

  const isSoldOut = event.isSoldOut ?? false;


  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={containerVariants}
      style={{ paddingBottom: 150, minHeight: '100vh', position: 'relative' }}
    >
      <Helmet>
        <title>{`${event.title} - Code829`}</title>
        <meta name="description" content={event.description ? event.description.slice(0, 160) : 'Event details on Code829'} />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={event.description ? event.description.slice(0, 160) : 'Event details on Code829'} />
        {event.imageUrl ? <meta property="og:image" content={event.imageUrl} /> : null}
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={event.description ? event.description.slice(0, 160) : 'Event details on Code829'} />
        {event.imageUrl ? <meta name="twitter:image" content={event.imageUrl} /> : null}
        {event.slug ? <link rel="canonical" href={`https://code829.com/events/${event.slug}`} /> : null}
        {structuredData ? <script type="application/ld+json">{structuredData}</script> : null}
      </Helmet>
      <EventHero event={event} itemVariants={itemVariants} />

      <div className="page-container" style={{ marginTop: isMobile ? 32 : 60 }}>
        <Row gutter={isMobile ? [24, 24] : [60, 60]}>
          <Col xs={24} lg={15}>
            <EventAbout event={event} itemVariants={itemVariants} />
            {event?.slug && <EventLineup eventSlug={event.slug} />}
          </Col>
          <Col xs={24} lg={9}>
            <EventSidebar
              event={event}
              isSoldOut={isSoldOut}
              handleBookNow={handleBookNow}
              isStartingPurchase={isStartingPurchase}
              itemVariants={itemVariants}
            />
          </Col>
        </Row>
      </div>

      {isMobile && !isSoldOut && step === 'info' && !isKeyboardOpen && !isFooterVisible && (
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
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{'From'}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>
                {event.displayFromFormatted ?? 'Free'}
              </div>
            </div>
            <Button
              type="primary"
              onClick={handleBookNow}
              loading={isStartingPurchase}
              disabled={isStartingPurchase || paymentUnavailable}
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
