import React from "react";
import { Link } from "react-router-dom";
import EventCard, { type EventData } from "../../components/EventCard";
import { SkeletonCard } from "../../components/Skeleton";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { SectionHeader } from "./SectionHeader";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface CarouselSectionProps {
  title: string;
  subtitle?: string;
  events: EventData[];
  loading: boolean;
  linkTo?: string;
}

// ---------------------------------------------------------------------------
// CarouselSection
// ---------------------------------------------------------------------------
export function CarouselSection({
  title,
  subtitle,
  events,
  loading,
  linkTo,
}: CarouselSectionProps): React.ReactElement {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      style={{
        padding: "4rem 0",
        background: "var(--bg-primary)",
      }}
    >
      <div
        style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}
      >
        <SectionHeader title={title} subtitle={subtitle} linkTo={linkTo} />
      </div>
      <div
        className="snap-scroll"
        style={{
          display: "flex",
          gap: "1.25rem",
          overflowX: "auto",
          padding: "0.5rem 1.5rem 1rem",
          paddingLeft: "max(1.5rem, calc((100vw - 1280px) / 2 + 1.5rem))",
        }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} className="w-56 sm:w-64" />
            ))
          : (events ?? []).map((event, i) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                style={{
                  textDecoration: "none",
                  display: "block",
                  width: "224px",
                  flexShrink: 0,
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                <EventCard event={event} />
              </Link>
            ))}
      </div>
    </section>
  );
}
