import React from "react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { SectionHeader } from "./SectionHeader";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
interface Category {
  id: string;
  name: string;
  icon: string;
}

const CATEGORIES: Category[] = [
  { id: "Music", name: "Music", icon: "\uD83C\uDFB5" },
  { id: "Tech", name: "Tech", icon: "\uD83D\uDCBB" },
  { id: "Art", name: "Art", icon: "\uD83C\uDFA8" },
  { id: "Food", name: "Food", icon: "\uD83C\uDF7D\uFE0F" },
  { id: "Sports", name: "Sports", icon: "\u26A1" },
  { id: "Comedy", name: "Comedy", icon: "\uD83D\uDE02" },
  { id: "Wellness", name: "Wellness", icon: "\uD83E\uDDD8" },
  { id: "Theater", name: "Theater", icon: "\uD83C\uDFAD" },
];

// ---------------------------------------------------------------------------
// CategorySection
// ---------------------------------------------------------------------------
export function CategorySection(): React.ReactElement {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      style={{
        padding: "4rem 1.5rem",
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <SectionHeader title="Browse by Category" linkTo="/events" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.id}
              to={`/events?category=${cat.id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 1.2rem",
                borderRadius: "999px",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: 500,
                transition:
                  "background 0.2s, border-color 0.2s, transform 0.2s",
                animationDelay: `${i * 0.08}s`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "color-mix(in srgb, var(--accent-primary) 12%, transparent)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor =
                  "var(--accent-primary)";
                (e.currentTarget as HTMLAnchorElement).style.color =
                  "var(--accent-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "var(--bg-tertiary)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor =
                  "var(--border)";
                (e.currentTarget as HTMLAnchorElement).style.color =
                  "var(--text-primary)";
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
