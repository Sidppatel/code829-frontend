import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import type { EventDetail } from "./types";

export interface EventHeroProps {
  event: EventDetail;
}

export function EventHero({ event }: EventHeroProps): React.ReactElement {
  const heroRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll(): void {
      const bg = bgRef.current;
      if (!bg) return;
      const scrollY = window.scrollY;
      bg.style.transform = `translateY(${scrollY * 0.5}px)`;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const fallbackGradient =
    "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)";

  return (
    <div
      ref={heroRef}
      style={{
        position: "relative",
        minHeight: "360px",
        overflow: "hidden",
      }}
    >
      <div
        ref={bgRef}
        style={{
          position: "absolute",
          inset: "-20%",
          background: event.imageUrl ? undefined : fallbackGradient,
          willChange: "transform",
        }}
      >
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "1.5rem",
          right: "1.5rem",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <div style={{ maxWidth: "1280px" }}>
          <Link
            to="/events"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              color: "rgba(255,255,255,0.8)",
              textDecoration: "none",
              fontSize: "0.85rem",
              marginBottom: "1rem",
              width: "fit-content",
            }}
          >
            <ChevronLeft size={14} /> All Events
          </Link>
          <span
            style={{
              display: "inline-block",
              background: "var(--accent-cta)",
              color: "var(--bg-primary)",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "0.25rem 0.75rem",
              borderRadius: "999px",
              marginBottom: "0.75rem",
            }}
          >
            {event.category}
          </span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 5vw, 3.5rem)",
              fontWeight: 800,
              color: "rgba(255,255,255,0.97)",
              margin: "0 0 0.5rem",
            }}
          >
            {event.title}
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: "0.95rem",
              margin: 0,
            }}
          >
            by {event.organizer}
          </p>
        </div>
      </div>
    </div>
  );
}
