import React from "react";
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  Share2,
  Heart,
} from "lucide-react";
import TableSelectionView from "../../components/TableSelectionView";
import type { EventDetail, SelectedTable } from "./types";

export interface EventInfoProps {
  event: EventDetail;
  saved: boolean;
  onToggleSaved: () => void;
  isGridLayout: boolean;
  eventId: string | undefined;
  selectedTier: string | null;
  onTableSelected: (table: SelectedTable | null) => void;
}

export function EventInfo({
  event,
  saved,
  onToggleSaved,
  isGridLayout,
  eventId,
  selectedTier,
  onTableSelected,
}: EventInfoProps): React.ReactElement {
  return (
    <div>
      {/* Quick meta */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.25rem",
          marginBottom: "2rem",
          paddingBottom: "2rem",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {[
          {
            Icon: Calendar,
            label: new Date(event.startDate).toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              },
            ),
          },
          {
            Icon: Clock,
            label: new Date(event.startDate).toLocaleTimeString(
              "en-US",
              {
                hour: "2-digit",
                minute: "2-digit",
              },
            ),
          },
          {
            Icon: MapPin,
            label: `${event.venueName}${event.venueCity ? `, ${event.venueCity}` : ""}`,
          },
          {
            Icon: Users,
            label: `${event.attendeeCount.toLocaleString()} attending`,
          },
        ].map(({ Icon, label }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
            }}
          >
            <Icon
              size={14}
              style={{ color: "var(--accent-primary)", flexShrink: 0 }}
            />
            {label}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "2rem",
        }}
      >
        <button
          onClick={onToggleSaved}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.75rem",
            border: "1px solid var(--border)",
            background: saved
              ? "color-mix(in srgb, var(--color-pink) 12%, transparent)"
              : "var(--bg-secondary)",
            color: saved
              ? "var(--color-pink)"
              : "var(--text-secondary)",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            transition: "all 0.2s",
          }}
        >
          <Heart
            size={14}
            style={{ color: saved ? "var(--color-pink)" : "inherit" }}
            fill={saved ? "var(--color-pink)" : "none"}
          />
          {saved ? "Saved" : "Save"}
        </button>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.75rem",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--text-secondary)",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "var(--font-body)",
          }}
        >
          <Share2 size={14} /> Share
        </button>
      </div>

      {/* Description */}
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.3rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
          }}
        >
          About This Event
        </h2>
        {event.description.split("\n\n").map((para, i) => (
          <p
            key={i}
            style={{
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              marginBottom: "1rem",
              fontSize: "0.95rem",
            }}
          >
            {para}
          </p>
        ))}
      </div>

      {/* Venue */}
      <div
        style={{
          padding: "1.25rem",
          borderRadius: "1rem",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
            color: "var(--text-primary)",
          }}
        >
          Venue
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.5rem",
          }}
        >
          <MapPin
            size={14}
            style={{
              color: "var(--accent-primary)",
              marginTop: "2px",
              flexShrink: 0,
            }}
          />
          <div>
            <p
              style={{
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: "0 0 0.2rem",
                fontSize: "0.9rem",
              }}
            >
              {event.venueName}
            </p>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                margin: 0,
              }}
            >
              {event.venueAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Table layout for Grid events -- below venue */}
      {isGridLayout && eventId && selectedTier && (
        <div style={{
          padding: '1.25rem',
          borderRadius: '1rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700,
            marginBottom: '1rem', color: 'var(--text-primary)',
          }}>
            Select Your Table
          </h3>
          <TableSelectionView
            eventId={eventId}
            ticketTypeId={selectedTier}
            onTableSelected={(t) => onTableSelected(t ? { id: t.id, label: t.label, priceCents: t.priceCents, capacity: t.capacity, priceType: t.priceType, holdExpiresAt: t.holdExpiresAt } : null)}
          />
        </div>
      )}
    </div>
  );
}
