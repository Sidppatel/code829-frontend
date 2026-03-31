import React, { useEffect, useRef, useState } from "react";
import {
  Search,
  ArrowRight,
  Users,
  Star,
  Calendar,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import MagneticButton from "../../components/MagneticButton";
import AnimatedCounter from "../../components/AnimatedCounter";
import { eventsApi } from "../../services/eventsApi";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ApiEventItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  startDate: string;
  endDate: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  venueName: string;
  venueCity: string;
  venueState: string;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  totalCapacity: number | null;
  totalSold: number | null;
}

interface ApiEventsResponse {
  items: ApiEventItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface SearchSuggestion {
  id: string;
  title: string;
  category: string;
  venueName: string;
}

const SEARCH_PLACEHOLDERS = [
  "Search concerts near you\u2026",
  "Find tech conferences\u2026",
  "Discover food festivals\u2026",
  "Explore art exhibitions\u2026",
  "Browse comedy shows\u2026",
];

// ---------------------------------------------------------------------------
// HeroSection
// ---------------------------------------------------------------------------
export function HeroSection(): React.ReactElement {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Live autocomplete: fetch suggestions as user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.length < 2) {
      queueMicrotask(() => { setSuggestions([]); });
      return;
    }
    debounceRef.current = setTimeout(() => {
      eventsApi
        .list<ApiEventsResponse>(
          `search=${encodeURIComponent(searchQuery)}&pageSize=5`,
        )
        .then((res) => {
          setSuggestions(
            (res.data.items ?? []).map((e) => ({
              id: e.id,
              title: e.title,
              category: e.category,
              venueName: e.venueName,
            })),
          );
          setShowSuggestions(true);
        })
        .catch(() => setSuggestions([]));
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent): void {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSearch(): void {
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/events");
    }
    setShowSuggestions(false);
  }

  useEffect(() => {
    const current = SEARCH_PLACEHOLDERS[placeholderIdx];
    if (!isDeleting) {
      if (displayedPlaceholder.length < current.length) {
        typingRef.current = setTimeout(() => {
          setDisplayedPlaceholder(
            current.slice(0, displayedPlaceholder.length + 1),
          );
        }, 60);
      } else {
        typingRef.current = setTimeout(() => setIsDeleting(true), 2000);
      }
    } else {
      if (displayedPlaceholder.length > 0) {
        typingRef.current = setTimeout(() => {
          setDisplayedPlaceholder(displayedPlaceholder.slice(0, -1));
        }, 30);
      } else {
        queueMicrotask(() => {
          setIsDeleting(false);
          setPlaceholderIdx((i) => (i + 1) % SEARCH_PLACEHOLDERS.length);
        });
      }
    }
    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
    };
  }, [displayedPlaceholder, isDeleting, placeholderIdx]);

  const words = ["Discover.", "Experience.", "Celebrate."];

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "80px 1.5rem 3rem",
        background: "var(--bg-primary)",
      }}
    >
      {/* Animated gradient blobs */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "60vw",
            height: "60vw",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--accent-primary) 18%, transparent) 0%, transparent 70%)",
            animation: "blob1 12s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "-15%",
            width: "50vw",
            height: "50vw",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--accent-secondary) 15%, transparent) 0%, transparent 70%)",
            animation: "blob2 15s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            left: "20%",
            width: "40vw",
            height: "40vw",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--accent-cta) 10%, transparent) 0%, transparent 70%)",
            animation: "blob3 18s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes blob1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(5%, 8%) scale(1.05); }
          66% { transform: translate(-3%, 4%) scale(0.97); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-6%, 4%) scale(1.08); }
          66% { transform: translate(4%, -6%) scale(0.95); }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-8%, -5%) scale(1.1); }
        }
      `}</style>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          maxWidth: "800px",
          width: "100%",
        }}
      >
        {/* Staggered headline */}
        <h1
          className="c829-home-hero-heading"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            margin: "0 0 1.5rem",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0.4em",
          }}
        >
          {words.map((word, i) => (
            <span
              key={word}
              className={`hero-word hero-word-${i}`}
              style={{
                display: "inline-block",
                opacity: 0,
                transform: "translateY(30px)",
                animation: `wordIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.18}s forwards`,
              }}
            >
              {word}
            </span>
          ))}
        </h1>

        <style>{`
          @keyframes wordIn {
            to { opacity: 1; transform: translateY(0); }
          }
          .hero-word-0 { color: var(--text-primary); }
          .hero-word-1 {
            background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .hero-word-2 {
            background: linear-gradient(135deg, var(--accent-cta), var(--accent-secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
        `}</style>

        <p
          style={{
            fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
            color: "var(--text-secondary)",
            marginBottom: "2.5rem",
            opacity: 0,
            animation:
              "wordIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.55s forwards",
          }}
        >
          Thousands of live experiences — concerts, tech talks, food festivals &
          more.
        </p>

        {/* Animated search bar with autocomplete */}
        <div
          ref={searchContainerRef}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "560px",
            margin: "0 auto 2rem",
            zIndex: 10,
            opacity: 0,
            animation:
              "wordIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.72s forwards",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              background: "var(--bg-secondary)",
              border: "1.5px solid var(--border)",
              borderRadius:
                showSuggestions && suggestions.length > 0
                  ? "1rem 1rem 0 0"
                  : "1rem",
              padding: "0.6rem 0.6rem 0.6rem 1.2rem",
              boxShadow: "var(--shadow-card-hover)",
            }}
          >
            <Search
              size={18}
              style={{ color: "var(--text-tertiary)", flexShrink: 0 }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder={displayedPlaceholder}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "1rem",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.6rem 1.2rem",
                borderRadius: "0.65rem",
                background: "var(--accent-primary)",
                color: "var(--bg-primary)",
                fontWeight: 600,
                fontSize: "0.9rem",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "var(--font-body)",
              }}
            >
              Search <ArrowRight size={14} />
            </button>
          </div>

          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "var(--bg-secondary)",
                border: "1.5px solid var(--border)",
                borderTop: "none",
                borderRadius: "0 0 1rem 1rem",
                boxShadow: "var(--shadow-card-hover)",
                zIndex: 50,
                overflow: "hidden",
              }}
            >
              {suggestions.map((s) => (
                <Link
                  key={s.id}
                  to={`/events/${s.id}`}
                  onClick={() => setShowSuggestions(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.7rem 1.2rem",
                    textDecoration: "none",
                    borderTop: "1px solid var(--border)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-tertiary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                      }}
                    >
                      {s.title}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      {s.venueName}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      padding: "0.15rem 0.5rem",
                      borderRadius: "999px",
                      background:
                        "color-mix(in srgb, var(--accent-primary) 12%, transparent)",
                      color: "var(--accent-primary)",
                    }}
                  >
                    {s.category}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            justifyContent: "center",
            marginBottom: "3rem",
            opacity: 0,
            animation:
              "wordIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.88s forwards",
          }}
        >
          <MagneticButton onClick={() => navigate("/events")}>
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              Browse All Events <ArrowRight size={16} />
            </span>
          </MagneticButton>
        </div>

        {/* Social proof counters */}
        <div
          className="c829-home-stats"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "2rem",
            justifyContent: "center",
            opacity: 0,
            animation: "wordIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) 1s forwards",
          }}
        >
          {[
            {
              icon: Calendar,
              target: 4800,
              suffix: "+",
              label: "Events Listed",
            },
            {
              icon: Users,
              target: 120000,
              suffix: "+",
              label: "Happy Attendees",
            },
            { icon: Star, target: 98, suffix: "%", label: "Satisfaction Rate" },
          ].map(({ icon: Icon, target, suffix, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  justifyContent: "center",
                  marginBottom: "0.2rem",
                }}
              >
                <Icon size={16} style={{ color: "var(--accent-primary)" }} />
                <AnimatedCounter
                  target={target}
                  suffix={suffix}
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    fontFamily: "var(--font-display)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-tertiary)",
                  margin: 0,
                }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
