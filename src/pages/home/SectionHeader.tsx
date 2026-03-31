import React from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  linkTo?: string;
}

// ---------------------------------------------------------------------------
// SectionHeader
// ---------------------------------------------------------------------------
export function SectionHeader({
  title,
  subtitle,
  linkTo,
}: SectionHeaderProps): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: "1.5rem",
        flexWrap: "wrap",
        gap: "0.5rem",
      }}
    >
      <div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.4rem, 3vw, 2rem)",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 0.25rem",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              margin: 0,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--accent-primary)",
            textDecoration: "none",
          }}
        >
          See all <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}
