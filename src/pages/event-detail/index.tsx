import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet-async";
import MagneticButton from "../../components/MagneticButton";
import { SkeletonLine, SkeletonText } from "../../components/Skeleton";
import { eventsApi, seatsApi } from '../../services/eventsApi';
import { bookingsApi } from '../../services/bookingsApi';
import { useAuthStore } from "../../stores/authStore";
import { formatPriceCents as formatCents } from '../../lib/format';
import type { ApiEventDetail, SelectedTable } from "./types";
import { apiToEventDetail, PLACEHOLDER_EVENT } from "./types";
import { EventHero } from "./EventHero";
import { EventInfo } from "./EventInfo";
import { BookingPanel } from "./BookingPanel";

export default function EventDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const [event, setEvent] = useState<ReturnType<typeof apiToEventDetail> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState(false);
  const [selectedTable, setSelectedTable] = useState<SelectedTable | null>(null);
  const [booking, setBooking] = useState(false);
  const navigate = useNavigate();
  const isGridLayout = event?.layoutMode === 'Grid';

  async function handleTableBooking(): Promise<void> {
    if (!selectedTable || !selectedTier || !id) return;
    const confirmed = window.confirm(
      `Book table ${selectedTable.label} (${selectedTable.capacity} seats) for ${formatCents(selectedTable.priceCents)}? This will be charged immediately.`
    );
    if (!confirmed) return;
    setBooking(true);
    try {
      // Get seat IDs for the held table
      const holdsRes = await seatsApi.getHolds<Array<{ seatId: string }>>(id ?? '');
      const seatIds = holdsRes.data.map(h => h.seatId);
      if (seatIds.length === 0) {
        toast.error('No active hold found. Please select a table first.');
        setBooking(false);
        return;
      }

      // Create booking with one item per seat
      const items = seatIds.map(seatId => ({ ticketTypeId: selectedTier, seatId }));
      const bookingRes = await bookingsApi.create(id ?? '', items);
      const bookingId = bookingRes.data.id;

      // Auto-confirm payment (mock/dev mode)
      await bookingsApi.confirm(bookingId);
      toast.success('Table booked successfully!');
      navigate('/me/bookings');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Booking failed';
      toast.error(msg);
    } finally {
      setBooking(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetchEvent(): Promise<void> {
      try {
        const res = await eventsApi.getById<ApiEventDetail>(id ?? '');
        if (!cancelled) {
          const detail = apiToEventDetail(res.data);
          setEvent(detail);
          setSelectedTier(detail.tickets[0]?.id ?? null);
        }
      } catch {
        if (!cancelled) {
          setEvent(PLACEHOLDER_EVENT);
          setSelectedTier(PLACEHOLDER_EVENT.tickets[0]?.id ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchEvent();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const selectedTierData = event?.tickets.find((t) => t.id === selectedTier);
  const totalCents = selectedTierData
    ? selectedTierData.totalPriceCents * quantity
    : 0;

  if (loading) {
    return (
      <div style={{ paddingTop: "64px" }}>
        <div
          style={{
            height: "60vh",
            background: "var(--skeleton-base)",
            animation: "shimmer 1.5s infinite",
          }}
        />
        <div
          className="c829-event-layout"
          style={{
            maxWidth: "1280px",
            margin: "2rem auto",
            padding: "0 1.5rem",
            display: "grid",
            gridTemplateColumns: "1fr 400px",
            gap: "2rem",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <SkeletonLine className="h-8 w-3/4" />
            <SkeletonText />
          </div>
          <div
            style={{
              height: "400px",
              background: "var(--bg-secondary)",
              borderRadius: "1rem",
              border: "1px solid var(--border)",
            }}
          />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div
        style={{
          paddingTop: "64px",
          textAlign: "center",
          color: "var(--text-secondary)",
          padding: "4rem",
        }}
      >
        Event not found.
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{event.title} — Code829</title>
        <meta name="description" content={event.description.slice(0, 160)} />
      </Helmet>

      <div>
        <EventHero event={event} />

        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "2.5rem 1.5rem 6rem",
          }}
        >
          <div
            className="c829-event-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 400px)",
              gap: "3rem",
              alignItems: "start",
            }}
          >
            {/* LEFT: event details */}
            <EventInfo
              event={event}
              saved={saved}
              onToggleSaved={() => setSaved((v) => !v)}
              isGridLayout={isGridLayout}
              eventId={id}
              selectedTier={selectedTier}
              onTableSelected={setSelectedTable}
            />

            {/* RIGHT: sticky sidebar */}
            <BookingPanel
              event={event}
              selectedTier={selectedTier}
              onSelectTier={setSelectedTier}
              quantity={quantity}
              onSetQuantity={setQuantity}
              totalCents={totalCents}
              isAuthenticated={isAuthenticated}
              isGridLayout={isGridLayout}
              selectedTable={selectedTable}
              booking={booking}
              onTableBooking={() => void handleTableBooking()}
            />
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div
        style={{
          display: "none",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--glass-bg)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--border)",
          padding: "1rem 1.5rem",
          zIndex: 80,
        }}
        className="mobile-booking-bar"
      >
        <style>{`
          @media (max-width: 768px) {
            .mobile-booking-bar { display: flex !important; align-items: center; gap: 1rem; }
          }
        `}</style>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
            From
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.1rem",
              fontWeight: 800,
              color: "var(--accent-cta)",
            }}
          >
            {formatCents(event.tickets[0]?.priceCents ?? 0)}
          </div>
        </div>
        <MagneticButton style={{ flex: 1, justifyContent: "center" }}>
          Get Tickets
        </MagneticButton>
      </div>
    </>
  );
}
