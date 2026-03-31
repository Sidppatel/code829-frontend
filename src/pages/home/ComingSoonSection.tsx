import React from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { type EventData } from "../../components/EventCard";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { SectionHeader } from "./SectionHeader";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface ComingSoonSectionProps {
  events: EventData[];
  loading: boolean;
}

// ---------------------------------------------------------------------------
// ComingSoonSection
// ---------------------------------------------------------------------------
export function ComingSoonSection({
  events,
  loading,
}: ComingSoonSectionProps): React.ReactElement {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      style={{ padding: "4rem 1.5rem", background: "var(--bg-primary)" }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <SectionHeader
          title="Coming Soon"
          subtitle="Mark your calendar"
          linkTo="/events"
        />

        {loading ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: "88px",
                  borderRadius: "1rem",
                  background: "var(--skeleton-base)",
                  animation: "shimmer 1.5s infinite",
                }}
              />
            ))}
          </div>
        ) : (events ?? []).length === 0 ? null : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {(events ?? []).map((event, i) => {
              const displayDate = event.startDate ?? event.date ?? "";
              const displayVenue = event.venueName ?? event.venue ?? "";
              const displayCity = event.venueCity ?? event.city ?? "";
              const gradient =
                event.imageGradient ??
                "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)";

              return (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    alignItems: "center",
                    padding: "1rem",
                    borderRadius: "1rem",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                    transition: "box-shadow 0.2s, transform 0.2s",
                    animationDelay: `${i * 0.08}s`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      "var(--shadow-card-hover)";
                    (e.currentTarget as HTMLAnchorElement).style.transform =
                      "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      "none";
                    (e.currentTarget as HTMLAnchorElement).style.transform =
                      "none";
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "0.75rem",
                      background: gradient,
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {event.imageUrl && (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        color: "var(--accent-primary)",
                      }}
                    >
                      {event.category}
                    </span>
                    <h4
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        margin: "0.15rem 0 0.25rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {event.title}
                    </h4>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                        margin: 0,
                      }}
                    >
                      {displayDate
                        ? new Date(displayDate).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : ""}
                      {displayDate && displayCity ? " · " : ""}
                      {displayCity || displayVenue}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    style={{ color: "var(--text-tertiary)", flexShrink: 0 }}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
