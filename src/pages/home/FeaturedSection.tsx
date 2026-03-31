import React from "react";
import { Link } from "react-router-dom";
import { type EventData } from "../../components/EventCard";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { SectionHeader } from "./SectionHeader";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface FeaturedSectionProps {
  event: EventData | null;
}

// ---------------------------------------------------------------------------
// FeaturedSection
// ---------------------------------------------------------------------------
export function FeaturedSection({
  event,
}: FeaturedSectionProps): React.ReactElement {
  const ref = useScrollReveal<HTMLElement>();

  if (!event) return <></>;

  const gradient =
    event.imageGradient ??
    "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)";

  const displayVenue = event.venueName ?? event.venue ?? "";
  const displayCity = event.venueCity ?? event.city ?? "";

  return (
    <section ref={ref} style={{ padding: "0 1.5rem 4rem" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <SectionHeader title="Featured Event" />
        <Link
          to={`/events/${event.id}`}
          style={{ textDecoration: "none", display: "block" }}
        >
          <div
            style={{
              borderRadius: "1.5rem",
              overflow: "hidden",
              position: "relative",
              minHeight: "400px",
              background: event.imageUrl ? undefined : gradient,
              display: "flex",
              alignItems: "flex-end",
              cursor: "pointer",
            }}
          >
            {event.imageUrl && (
              <img
                src={event.imageUrl}
                alt={event.title}
                loading="lazy"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)",
              }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 1,
                padding: "2.5rem",
                color: "var(--bg-primary)",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  background: "var(--accent-cta)",
                  color: "var(--bg-primary)",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "0.25rem 0.7rem",
                  borderRadius: "999px",
                  marginBottom: "0.75rem",
                }}
              >
                {event.category}
              </span>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                  fontWeight: 800,
                  margin: "0 0 0.5rem",
                }}
              >
                {event.title}
              </h3>
              <p style={{ fontSize: "0.95rem", opacity: 0.85, margin: 0 }}>
                {displayVenue}
                {displayVenue && displayCity ? " · " : ""}
                {displayCity}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
