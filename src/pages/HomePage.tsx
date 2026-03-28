import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, ArrowRight, Users, Star, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import MagneticButton from '../components/MagneticButton';
import AnimatedCounter from '../components/AnimatedCounter';
import EventCard, { type EventData } from '../components/EventCard';
import { SkeletonCard } from '../components/Skeleton';
import { useScrollReveal } from '../hooks/useScrollReveal';
import apiClient from '../lib/axios';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface ComingSoonEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  city: string;
  imageGradient: string;
}

// ---------------------------------------------------------------------------
// Placeholder data (used when API is unreachable)
// ---------------------------------------------------------------------------
const PLACEHOLDER_EVENTS: EventData[] = [
  {
    id: '1', title: 'Neon Frequencies Festival', category: 'Music',
    venue: 'Amphitheater Park', city: 'Austin', date: new Date(Date.now() + 86400000 * 2).toISOString(),
    price: 89,
  },
  {
    id: '2', title: 'React Summit 2026', category: 'Tech',
    venue: 'Convention Center', city: 'San Francisco', date: new Date(Date.now() + 86400000 * 4).toISOString(),
    price: 199, isFomo: true,
  },
  {
    id: '3', title: 'Urban Art Walk', category: 'Art',
    venue: 'Downtown Gallery District', city: 'New York', date: new Date(Date.now() + 86400000 * 1).toISOString(),
    price: 0,
  },
  {
    id: '4', title: 'Street Food & Wine', category: 'Food',
    venue: 'Riverside Park', city: 'Chicago', date: new Date(Date.now() + 86400000 * 3).toISOString(),
    price: 35,
  },
  {
    id: '5', title: 'Jazz Under the Stars', category: 'Music',
    venue: 'Rooftop Lounge 42', city: 'New Orleans', date: new Date(Date.now() + 86400000 * 5).toISOString(),
    price: 55,
  },
];

const PLACEHOLDER_TRENDING: EventData[] = [
  {
    id: '6', title: 'Hackathon: Build the Future', category: 'Tech',
    venue: 'Innovation Hub', city: 'Seattle', date: new Date(Date.now() + 86400000 * 6).toISOString(),
    price: 0, isFomo: true,
  },
  {
    id: '7', title: 'Midnight Cinema Classics', category: 'Art',
    venue: 'The Criterion', city: 'Los Angeles', date: new Date(Date.now() + 86400000 * 7).toISOString(),
    price: 18,
  },
  {
    id: '8', title: 'Marathon City Run 2026', category: 'Sports',
    venue: 'City Hall Plaza', city: 'Boston', date: new Date(Date.now() + 86400000 * 8).toISOString(),
    price: 45,
  },
  {
    id: '9', title: 'Farm-to-Table Dinner', category: 'Food',
    venue: 'Verdana Estate', city: 'Portland', date: new Date(Date.now() + 86400000 * 9).toISOString(),
    price: 120, isFomo: true,
  },
];

const CATEGORIES: Category[] = [
  { id: 'music', name: 'Music', icon: '🎵', count: 284 },
  { id: 'tech', name: 'Tech', icon: '💻', count: 156 },
  { id: 'art', name: 'Art', icon: '🎨', count: 203 },
  { id: 'food', name: 'Food', icon: '🍽️', count: 178 },
  { id: 'sports', name: 'Sports', icon: '⚡', count: 97 },
  { id: 'comedy', name: 'Comedy', icon: '😂', count: 64 },
  { id: 'wellness', name: 'Wellness', icon: '🧘', count: 88 },
  { id: 'theater', name: 'Theater', icon: '🎭', count: 112 },
];

const COMING_SOON: ComingSoonEvent[] = [
  {
    id: 'cs1', title: 'Blockchain & Beyond: Web3 Summit', category: 'Tech',
    date: new Date(Date.now() + 86400000 * 21).toISOString(), city: 'Miami',
    imageGradient: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--color-info) 100%)',
  },
  {
    id: 'cs2', title: 'Global Street Art Festival', category: 'Art',
    date: new Date(Date.now() + 86400000 * 28).toISOString(), city: 'Chicago',
    imageGradient: 'linear-gradient(135deg, var(--color-pink) 0%, var(--accent-secondary) 100%)',
  },
  {
    id: 'cs3', title: 'International Jazz Festival', category: 'Music',
    date: new Date(Date.now() + 86400000 * 35).toISOString(), city: 'New Orleans',
    imageGradient: 'linear-gradient(135deg, var(--accent-cta) 0%, var(--color-yellow) 100%)',
  },
  {
    id: 'cs4', title: 'Culinary World Expo', category: 'Food',
    date: new Date(Date.now() + 86400000 * 42).toISOString(), city: 'New York',
    imageGradient: 'linear-gradient(135deg, var(--color-success) 0%, var(--color-info) 100%)',
  },
];

const SEARCH_PLACEHOLDERS = [
  'Search concerts near you…',
  'Find tech conferences…',
  'Discover food festivals…',
  'Explore art exhibitions…',
  'Browse comedy shows…',
];

// ---------------------------------------------------------------------------
// Hero section
// ---------------------------------------------------------------------------
function HeroSection(): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const current = SEARCH_PLACEHOLDERS[placeholderIdx];
    if (!isDeleting) {
      if (displayedPlaceholder.length < current.length) {
        typingRef.current = setTimeout(() => {
          setDisplayedPlaceholder(current.slice(0, displayedPlaceholder.length + 1));
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
        setIsDeleting(false);
        setPlaceholderIdx((i) => (i + 1) % SEARCH_PLACEHOLDERS.length);
      }
    }
    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
    };
  }, [displayedPlaceholder, isDeleting, placeholderIdx]);

  const words = ['Discover.', 'Experience.', 'Celebrate.'];

  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '80px 1.5rem 3rem',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Animated gradient blobs */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '60vw', height: '60vw', borderRadius: '50%',
          background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-primary) 18%, transparent) 0%, transparent 70%)',
          animation: 'blob1 12s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '10%', right: '-15%',
          width: '50vw', height: '50vw', borderRadius: '50%',
          background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-secondary) 15%, transparent) 0%, transparent 70%)',
          animation: 'blob2 15s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '20%',
          width: '40vw', height: '40vw', borderRadius: '50%',
          background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-cta) 10%, transparent) 0%, transparent 70%)',
          animation: 'blob3 18s ease-in-out infinite',
        }} />
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

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '800px', width: '100%' }}>
        {/* Staggered headline */}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            margin: '0 0 1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.4em',
          }}
        >
          {words.map((word, i) => (
            <span
              key={word}
              style={{
                display: 'inline-block',
                opacity: 0,
                transform: 'translateY(30px)',
                animation: `wordIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                animationDelay: `${i * 0.18}s`,
                background: i === 2
                  ? 'linear-gradient(135deg, var(--accent-cta), var(--accent-secondary))'
                  : i === 1
                  ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                  : 'var(--text-primary)',
                WebkitBackgroundClip: i >= 1 ? 'text' : undefined,
                WebkitTextFillColor: i >= 1 ? 'transparent' : undefined,
                backgroundClip: i >= 1 ? 'text' : undefined,
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
        `}</style>

        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: 'var(--text-secondary)',
            marginBottom: '2.5rem',
            opacity: 0,
            animation: 'wordIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.55s forwards',
          }}
        >
          Thousands of live experiences — concerts, tech talks, food festivals & more.
        </p>

        {/* Animated search bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'var(--bg-secondary)',
            border: '1.5px solid var(--border)',
            borderRadius: '1rem',
            padding: '0.6rem 0.6rem 0.6rem 1.2rem',
            boxShadow: 'var(--shadow-card-hover)',
            marginBottom: '2rem',
            opacity: 0,
            animation: 'wordIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.72s forwards',
          }}
        >
          <Search size={18} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={displayedPlaceholder}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '1rem',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
            }}
          />
          <Link
            to={`/events${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1.2rem',
              borderRadius: '0.65rem',
              background: 'var(--accent-primary)',
              color: 'var(--bg-primary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Search <ArrowRight size={14} />
          </Link>
        </div>

        {/* CTA */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
            marginBottom: '3rem',
            opacity: 0,
            animation: 'wordIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.88s forwards',
          }}
        >
          <MagneticButton onClick={() => {}}>
            Browse All Events <ArrowRight size={16} />
          </MagneticButton>
        </div>

        {/* Social proof counters */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2rem',
            justifyContent: 'center',
            opacity: 0,
            animation: 'wordIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) 1s forwards',
          }}
        >
          {[
            { icon: Calendar, target: 4800, suffix: '+', label: 'Events Listed' },
            { icon: Users, target: 120000, suffix: '+', label: 'Happy Attendees' },
            { icon: Star, target: 98, suffix: '%', label: 'Satisfaction Rate' },
          ].map(({ icon: Icon, target, suffix, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', marginBottom: '0.2rem' }}>
                <Icon size={16} style={{ color: 'var(--accent-primary)' }} />
                <AnimatedCounter
                  target={target}
                  suffix={suffix}
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper with scroll reveal
// ---------------------------------------------------------------------------
function RevealSection({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}): React.ReactElement {
  const ref = useScrollReveal<HTMLElement>();
  return (
    <section ref={ref} className={className} style={style}>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------
function SectionHeader({
  title,
  subtitle,
  linkTo,
}: {
  title: string;
  subtitle?: string;
  linkTo?: string;
}): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}
    >
      <div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 0.25rem',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            {subtitle}
          </p>
        )}
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--accent-primary)',
            textDecoration: 'none',
          }}
        >
          See all <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Carousel section
// ---------------------------------------------------------------------------
function CarouselSection({
  title,
  subtitle,
  events,
  loading,
  linkTo,
}: {
  title: string;
  subtitle?: string;
  events: EventData[];
  loading: boolean;
  linkTo?: string;
}): React.ReactElement {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      style={{
        padding: '4rem 0',
        background: 'var(--bg-primary)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        <SectionHeader title={title} subtitle={subtitle} linkTo={linkTo} />
      </div>
      <div
        className="snap-scroll"
        style={{
          display: 'flex',
          gap: '1.25rem',
          overflowX: 'auto',
          padding: '0.5rem 1.5rem 1rem',
          paddingLeft: 'max(1.5rem, calc((100vw - 1280px) / 2 + 1.5rem))',
        }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} className="w-56 sm:w-64" />
            ))
          : events.map((event, i) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                style={{
                  textDecoration: 'none',
                  display: 'block',
                  width: '224px',
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

// ---------------------------------------------------------------------------
// Featured event hero card
// ---------------------------------------------------------------------------
function FeaturedSection({ event }: { event: EventData | null }): React.ReactElement {
  const ref = useScrollReveal<HTMLElement>();

  if (!event) return <></>;

  const gradient = event.imageGradient ??
    'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)';

  return (
    <section
      ref={ref}
      style={{ padding: '0 1.5rem 4rem' }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <SectionHeader title="Featured Event" />
        <Link
          to={`/events/${event.id}`}
          style={{ textDecoration: 'none', display: 'block' }}
        >
          <div
            style={{
              borderRadius: '1.5rem',
              overflow: 'hidden',
              position: 'relative',
              minHeight: '400px',
              background: gradient,
              display: 'flex',
              alignItems: 'flex-end',
              cursor: 'pointer',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)',
              }}
            />
            <div style={{ position: 'relative', zIndex: 1, padding: '2.5rem', color: 'var(--bg-primary)' }}>
              <span style={{
                display: 'inline-block',
                background: 'var(--accent-cta)',
                color: 'var(--bg-primary)',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '0.25rem 0.7rem',
                borderRadius: '999px',
                marginBottom: '0.75rem',
              }}>
                {event.category}
              </span>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                fontWeight: 800,
                margin: '0 0 0.5rem',
              }}>
                {event.title}
              </h3>
              <p style={{ fontSize: '0.95rem', opacity: 0.85, margin: 0 }}>
                {event.venue} · {event.city}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Category pills
// ---------------------------------------------------------------------------
function CategorySection(): React.ReactElement {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      style={{
        padding: '4rem 1.5rem',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <SectionHeader title="Browse by Category" linkTo="/events" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.id}
              to={`/events?category=${cat.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.2rem',
                borderRadius: '999px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'background 0.2s, border-color 0.2s, transform 0.2s',
                animationDelay: `${i * 0.08}s`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'color-mix(in srgb, var(--accent-primary) 12%, transparent)';
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--accent-primary)';
                (e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-tertiary)';
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)';
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {cat.count}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Coming Soon vertical feed
// ---------------------------------------------------------------------------
function ComingSoonSection(): React.ReactElement {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      style={{ padding: '4rem 1.5rem', background: 'var(--bg-primary)' }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <SectionHeader title="Coming Soon" subtitle="Mark your calendar" linkTo="/events" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {COMING_SOON.map((event, i) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                padding: '1rem',
                borderRadius: '1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                transition: 'box-shadow 0.2s, transform 0.2s',
                animationDelay: `${i * 0.08}s`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'var(--shadow-card-hover)';
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLAnchorElement).style.transform = 'none';
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '0.75rem',
                  background: event.imageGradient,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-primary)',
                }}>
                  {event.category}
                </span>
                <h4 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: '0.15rem 0 0.25rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {event.title}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {new Date(event.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })} · {event.city}
                </p>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function HomePage(): React.ReactElement {
  const [weekendEvents, setWeekendEvents] = useState<EventData[]>([]);
  const [trendingEvents, setTrendingEvents] = useState<EventData[]>([]);
  const [loadingWeekend, setLoadingWeekend] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [featuredEvent, setFeaturedEvent] = useState<EventData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeekend(): Promise<void> {
      try {
        const res = await apiClient.get<{ data: EventData[] }>('/events?timeframe=weekend&limit=8');
        if (!cancelled) {
          setWeekendEvents(res.data.data);
          setFeaturedEvent(res.data.data[0] ?? null);
        }
      } catch {
        if (!cancelled) {
          setWeekendEvents(PLACEHOLDER_EVENTS);
          setFeaturedEvent(PLACEHOLDER_EVENTS[1]);
        }
      } finally {
        if (!cancelled) setLoadingWeekend(false);
      }
    }

    async function fetchTrending(): Promise<void> {
      try {
        const res = await apiClient.get<{ data: EventData[] }>('/events?sort=trending&limit=8');
        if (!cancelled) setTrendingEvents(res.data.data);
      } catch {
        if (!cancelled) setTrendingEvents(PLACEHOLDER_TRENDING);
      } finally {
        if (!cancelled) setLoadingTrending(false);
      }
    }

    void fetchWeekend();
    void fetchTrending();

    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <Helmet>
        <title>Code829 — Discover Live Events</title>
        <meta name="description" content="Find and book the best concerts, tech talks, food festivals and more near you." />
      </Helmet>

      <HeroSection />

      <CarouselSection
        title="This Weekend"
        subtitle="Events happening in the next 3 days"
        events={weekendEvents}
        loading={loadingWeekend}
        linkTo="/events?timeframe=weekend"
      />

      <FeaturedSection event={featuredEvent} />

      <CategorySection />

      <CarouselSection
        title="Trending Near You"
        subtitle="What everyone's talking about"
        events={trendingEvents}
        loading={loadingTrending}
        linkTo="/events?sort=trending"
      />

      <ComingSoonSection />

      {/* Footer spacer */}
      <div style={{ height: '4rem', background: 'var(--bg-primary)' }} />
    </>
  );
}
