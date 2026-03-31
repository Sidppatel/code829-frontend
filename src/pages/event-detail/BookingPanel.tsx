import React from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import MagneticButton from "../../components/MagneticButton";
import { formatPriceCents as formatCents } from '../../lib/format';
import type { EventDetail, TicketTier, SelectedTable } from "./types";

// ---------------------------------------------------------------------------
// Ticket tier card (internal to booking panel)
// ---------------------------------------------------------------------------
function TicketCard({
  tier,
  selected,
  onSelect,
}: {
  tier: TicketTier;
  selected: boolean;
  onSelect: () => void;
}): React.ReactElement {
  const availabilityPct =
    tier.total > 0 ? (tier.available / tier.total) * 100 : 0;
  const isLow = tier.available > 0 && tier.available <= tier.total * 0.2;
  const isSoldOut = tier.available === 0;

  return (
    <div
      onClick={isSoldOut ? undefined : onSelect}
      style={{
        padding: "1.25rem",
        borderRadius: "1rem",
        border: "2px solid",
        borderColor: selected ? "var(--accent-primary)" : "var(--border)",
        background: selected
          ? "color-mix(in srgb, var(--accent-primary) 6%, transparent)"
          : "var(--bg-secondary)",
        cursor: isSoldOut ? "not-allowed" : "pointer",
        opacity: isSoldOut ? 0.6 : 1,
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "0.5rem",
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 700,
              color: "var(--text-primary)",
              fontSize: "0.95rem",
            }}
          >
            {tier.name}
          </div>
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
              marginTop: "0.2rem",
            }}
          >
            {tier.description}
          </div>
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.15rem",
            fontWeight: 800,
            color: "var(--accent-cta)",
            whiteSpace: "nowrap",
            marginLeft: "1rem",
          }}
        >
          {formatCents(tier.totalPriceCents)}
        </div>
      </div>

      {/* Availability bar */}
      <div style={{ marginTop: "0.75rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.72rem",
            color: isLow ? "var(--accent-cta)" : "var(--text-tertiary)",
            marginBottom: "0.3rem",
          }}
        >
          <span>
            {isSoldOut
              ? "Sold Out"
              : isLow
                ? `Only ${tier.available} left!`
                : `${tier.available} available`}
          </span>
          <span>
            {tier.total - tier.available} / {tier.total} sold
          </span>
        </div>
        <div
          style={{
            height: "4px",
            background: "var(--bg-tertiary)",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${100 - availabilityPct}%`,
              background: isLow ? "var(--accent-cta)" : "var(--accent-primary)",
              borderRadius: "999px",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {selected && !isSoldOut && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            marginTop: "0.5rem",
            color: "var(--accent-primary)",
            fontSize: "0.78rem",
            fontWeight: 600,
          }}
        >
          <CheckCircle size={12} /> Selected
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Social proof strip
// ---------------------------------------------------------------------------
function SocialProof({ event }: { event: EventDetail }): React.ReactElement {
  const pct =
    event.maxAttendees > 0
      ? Math.round((event.attendeeCount / event.maxAttendees) * 100)
      : 0;
  return (
    <div
      style={{
        padding: "1rem",
        background: "color-mix(in srgb, var(--accent-primary) 6%, transparent)",
        borderRadius: "0.75rem",
        border:
          "1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        <Users size={15} style={{ color: "var(--accent-primary)" }} />
        <span
          style={{
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {event.attendeeCount.toLocaleString()} people going
        </span>
        {pct >= 80 && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.2rem",
              fontSize: "0.72rem",
              color: "var(--accent-cta)",
              fontWeight: 600,
            }}
          >
            <AlertCircle size={11} /> Almost full!
          </span>
        )}
      </div>
      <div
        style={{
          height: "6px",
          background: "var(--bg-tertiary)",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background:
              pct >= 80
                ? "linear-gradient(90deg, var(--accent-primary), var(--accent-cta))"
                : "var(--accent-primary)",
            borderRadius: "999px",
            transition: "width 1s ease",
          }}
        />
      </div>
      <p
        style={{
          fontSize: "0.72rem",
          color: "var(--text-tertiary)",
          margin: "0.4rem 0 0",
        }}
      >
        {event.maxAttendees - event.attendeeCount} spots remaining
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Booking Panel (sticky sidebar)
// ---------------------------------------------------------------------------
export interface BookingPanelProps {
  event: EventDetail;
  selectedTier: string | null;
  onSelectTier: (tierId: string) => void;
  quantity: number;
  onSetQuantity: (q: number) => void;
  totalCents: number;
  isAuthenticated: boolean;
  isGridLayout: boolean;
  selectedTable: SelectedTable | null;
  booking: boolean;
  onTableBooking: () => void;
}

export function BookingPanel({
  event,
  selectedTier,
  onSelectTier,
  quantity,
  onSetQuantity,
  totalCents,
  isAuthenticated,
  isGridLayout,
  selectedTable,
  booking,
  onTableBooking,
}: BookingPanelProps): React.ReactElement {
  const selectedTierData = event.tickets.find((t) => t.id === selectedTier);

  return (
    <div className="c829-event-sidebar" style={{ position: "sticky", top: "80px" }}>
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "1.25rem",
          padding: "1.5rem",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.15rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "1.25rem",
          }}
        >
          Get Tickets
        </h3>

        {event.maxAttendees > 0 && <SocialProof event={event} />}

        {/* Selected table summary for Grid layout */}
        {isGridLayout && selectedTable && (
          <div style={{
            marginBottom: '1.25rem', padding: '0.75rem 1rem',
            background: 'color-mix(in srgb, var(--color-success) 10%, var(--bg-tertiary))',
            borderRadius: '0.75rem', border: '1px solid var(--color-success)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                  Table {selectedTable.label}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {selectedTable.capacity} seats &middot; {formatCents(selectedTable.priceCents)}/{selectedTable.priceType === 'PerSeat' ? 'seat' : 'table'}
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cta)' }}>
                {formatCents(selectedTable.priceType === 'PerSeat' ? selectedTable.priceCents * selectedTable.capacity : selectedTable.priceCents)}
              </div>
            </div>
          </div>
        )}
        {isGridLayout && !selectedTable && (
          <div style={{
            marginBottom: '1.25rem', padding: '1rem', textAlign: 'center',
            color: 'var(--text-tertiary)', fontSize: '0.875rem',
            border: '1px dashed var(--border)', borderRadius: '0.75rem',
          }}>
            Select a table from the floor plan below
          </div>
        )}

        {/* Ticket tiers (only for non-Grid events) */}
        {!isGridLayout && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginBottom: "1.25rem",
          }}
        >
          {(event.tickets ?? []).map((tier) => (
            <TicketCard
              key={tier.id}
              tier={tier}
              selected={selectedTier === tier.id}
              onSelect={() => onSelectTier(tier.id)}
            />
          ))}
        </div>
        )}

        {/* Quantity (hidden for Grid layout -- you book a whole table) */}
        {!isGridLayout && selectedTierData && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.25rem",
              padding: "0.75rem 1rem",
              background: "var(--bg-tertiary)",
              borderRadius: "0.75rem",
            }}
          >
            <span
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
              }}
            >
              Quantity
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <button
                onClick={() => onSetQuantity(Math.max(1, quantity - 1))}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  border: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                −
              </button>
              <span
                style={{
                  fontWeight: 700,
                  minWidth: "1.5rem",
                  textAlign: "center",
                  color: "var(--text-primary)",
                }}
              >
                {quantity}
              </span>
              <button
                onClick={() => onSetQuantity(Math.min(10, quantity + 1))}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  border: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Total (hidden for Grid -- shown in table selection summary) */}
        {!isGridLayout && selectedTierData && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
              paddingBottom: "1.25rem",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.875rem",
              }}
            >
              Total
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.4rem",
                fontWeight: 800,
                color: "var(--accent-cta)",
              }}
            >
              {formatCents(totalCents)}
            </span>
          </div>
        )}

        {/* CTA */}
        {isAuthenticated ? (
          <MagneticButton
            style={{ width: "100%", justifyContent: "center" }}
            disabled={isGridLayout ? (!selectedTable || booking) : !selectedTier}
            onClick={isGridLayout ? onTableBooking : undefined}
          >
            {booking ? 'Processing...' : isGridLayout ? 'Confirm Table' : 'Book Now'}
          </MagneticButton>
        ) : (
          <Link
            to="/auth/login"
            style={{
              display: "block",
              width: "100%",
              padding: "0.85rem",
              borderRadius: "0.75rem",
              background: "var(--accent-cta)",
              color: "var(--bg-primary)",
              textAlign: "center",
              fontWeight: 700,
              textDecoration: "none",
              fontSize: "1rem",
            }}
          >
            Login to Book
          </Link>
        )}

        <p
          style={{
            textAlign: "center",
            fontSize: "0.72rem",
            color: "var(--text-tertiary)",
            marginTop: "0.75rem",
          }}
        >
          Free cancellation within 24 hours
        </p>
      </div>
    </div>
  );
}
