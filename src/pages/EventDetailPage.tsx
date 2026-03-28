import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  MapPin, Calendar, Users, Clock, Share2,
  Heart, ChevronLeft, CheckCircle, AlertCircle,
} from 'lucide-react';
import MagneticButton from '../components/MagneticButton';
import { SkeletonLine, SkeletonText } from '../components/Skeleton';
import apiClient from '../lib/axios';
import { useAuthStore } from '../stores/authStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TicketTier {
  id: string;
  name: string;
  price: number;
  description: string;
  available: number;
  total: number;
}

interface EventDetail {
  id: string;
  title: string;
  category: string;
  description: string;
  venue: string;
  city: string;
  address: string;
  date: string;
  endDate?: string;
  imageGradient?: string;
  organizer: string;
  attendeeCount: number;
  maxAttendees: number;
  tickets: TicketTier[];
  tags: string[];
}

// ---------------------------------------------------------------------------
// Placeholder
// ---------------------------------------------------------------------------
const PLACEHOLDER_EVENT: EventDetail = {
  id: '2',
  title: 'React Summit 2026',
  category: 'Tech',
  description: `Join the world's largest React conference for two days of keynotes, workshops, and networking with the best minds in the React ecosystem. Explore the latest in React 19, Server Components, concurrent features, and much more.

This year's summit features over 40 speakers from companies like Meta, Vercel, and the open-source community. Whether you're a beginner or a senior engineer, you'll leave with new skills, inspiration, and connections that will shape your career.`,
  venue: 'Moscone Convention Center',
  city: 'San Francisco',
  address: '747 Howard St, San Francisco, CA 94103',
  date: new Date(Date.now() + 86400000 * 4).toISOString(),
  endDate: new Date(Date.now() + 86400000 * 6).toISOString(),
  imageGradient: 'linear-gradient(135deg, var(--color-info) 0%, var(--accent-primary) 100%)',
  organizer: 'GitNation',
  attendeeCount: 1847,
  maxAttendees: 2000,
  tickets: [
    { id: 't1', name: 'General Admission', price: 199, description: 'Access to all talks and networking sessions', available: 153, total: 500 },
    { id: 't2', name: 'Workshop Pass', price: 349, description: 'All talks + 2 hands-on workshops of your choice', available: 28, total: 100 },
    { id: 't3', name: 'VIP Experience', price: 699, description: 'Full access + speaker dinner + priority seating', available: 7, total: 30 },
  ],
  tags: ['React', 'JavaScript', 'TypeScript', 'Web Dev', 'Open Source'],
};

// ---------------------------------------------------------------------------
// Ticket tier card
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
  const availabilityPct = (tier.available / tier.total) * 100;
  const isLow = tier.available <= tier.total * 0.2;
  const isSoldOut = tier.available === 0;

  return (
    <div
      onClick={isSoldOut ? undefined : onSelect}
      style={{
        padding: '1.25rem',
        borderRadius: '1rem',
        border: '2px solid',
        borderColor: selected ? 'var(--accent-primary)' : 'var(--border)',
        background: selected
          ? 'color-mix(in srgb, var(--accent-primary) 6%, transparent)'
          : 'var(--bg-secondary)',
        cursor: isSoldOut ? 'not-allowed' : 'pointer',
        opacity: isSoldOut ? 0.6 : 1,
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            {tier.name}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {tier.description}
          </div>
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.15rem',
          fontWeight: 800,
          color: 'var(--accent-cta)',
          whiteSpace: 'nowrap',
          marginLeft: '1rem',
        }}>
          ${tier.price}
        </div>
      </div>

      {/* Availability bar */}
      <div style={{ marginTop: '0.75rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: isLow ? 'var(--accent-cta)' : 'var(--text-tertiary)',
          marginBottom: '0.3rem',
        }}>
          <span>
            {isSoldOut ? 'Sold Out' : isLow ? `Only ${tier.available} left!` : `${tier.available} available`}
          </span>
          <span>{tier.total - tier.available} / {tier.total} sold</span>
        </div>
        <div style={{
          height: '4px',
          background: 'var(--bg-tertiary)',
          borderRadius: '999px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${100 - availabilityPct}%`,
            background: isLow
              ? 'var(--accent-cta)'
              : 'var(--accent-primary)',
            borderRadius: '999px',
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {selected && !isSoldOut && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          marginTop: '0.5rem',
          color: 'var(--accent-primary)',
          fontSize: '0.78rem',
          fontWeight: 600,
        }}>
          <CheckCircle size={12} /> Selected
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Parallax hero
// ---------------------------------------------------------------------------
function ParallaxHero({ event }: { event: EventDetail }): React.ReactElement {
  const heroRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll(): void {
      const bg = bgRef.current;
      if (!bg) return;
      const scrollY = window.scrollY;
      bg.style.transform = `translateY(${scrollY * 0.5}px)`;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={heroRef}
      style={{
        position: 'relative',
        height: '60vh',
        minHeight: '360px',
        overflow: 'hidden',
      }}
    >
      <div
        ref={bgRef}
        style={{
          position: 'absolute',
          inset: '-20%',
          background: event.imageGradient ??
            'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
          willChange: 'transform',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        left: '1.5rem',
        right: '1.5rem',
        maxWidth: '1280px',
        margin: '0 auto',
      }}>
        <div style={{ maxWidth: '1280px' }}>
          <Link
            to="/events"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              color: 'rgba(255,255,255,0.8)',
              textDecoration: 'none',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            <ChevronLeft size={14} /> All Events
          </Link>
          <span style={{
            display: 'inline-block',
            background: 'var(--accent-cta)',
            color: 'var(--bg-primary)',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '0.2rem 0.65rem',
            borderRadius: '999px',
            marginBottom: '0.75rem',
          }}>
            {event.category}
          </span>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 5vw, 3.5rem)',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.97)',
            margin: '0 0 0.5rem',
          }}>
            {event.title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem', margin: 0 }}>
            by {event.organizer}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Social proof strip
// ---------------------------------------------------------------------------
function SocialProof({ event }: { event: EventDetail }): React.ReactElement {
  const pct = Math.round((event.attendeeCount / event.maxAttendees) * 100);
  return (
    <div style={{
      padding: '1rem',
      background: 'color-mix(in srgb, var(--accent-primary) 6%, transparent)',
      borderRadius: '0.75rem',
      border: '1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)',
      marginBottom: '1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <Users size={15} style={{ color: 'var(--accent-primary)' }} />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {event.attendeeCount.toLocaleString()} people going
        </span>
        {pct >= 80 && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
            fontSize: '0.72rem',
            color: 'var(--accent-cta)',
            fontWeight: 600,
          }}>
            <AlertCircle size={11} /> Almost full!
          </span>
        )}
      </div>
      <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: pct >= 80
            ? 'linear-gradient(90deg, var(--accent-primary), var(--accent-cta))'
            : 'var(--accent-primary)',
          borderRadius: '999px',
          transition: 'width 1s ease',
        }} />
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: '0.4rem 0 0' }}>
        {event.maxAttendees - event.attendeeCount} spots remaining
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function EventDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetchEvent(): Promise<void> {
      try {
        const res = await apiClient.get<{ data: EventDetail }>(`/events/${id}`);
        if (!cancelled) {
          setEvent(res.data.data);
          setSelectedTier(res.data.data.tickets[0]?.id ?? null);
        }
      } catch {
        if (!cancelled) {
          setEvent(PLACEHOLDER_EVENT);
          setSelectedTier(PLACEHOLDER_EVENT.tickets[0].id);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchEvent();
    return () => { cancelled = true; };
  }, [id]);

  const selectedTierData = event?.tickets.find((t) => t.id === selectedTier);
  const totalPrice = selectedTierData ? selectedTierData.price * quantity : 0;

  if (loading) {
    return (
      <div style={{ paddingTop: '64px' }}>
        <div style={{ height: '60vh', background: 'var(--skeleton-base)', animation: 'shimmer 1.5s infinite' }} />
        <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SkeletonLine className="h-8 w-3/4" />
            <SkeletonText />
          </div>
          <div style={{ height: '400px', background: 'var(--bg-secondary)', borderRadius: '1rem', border: '1px solid var(--border)' }} />
        </div>
      </div>
    );
  }

  if (!event) return <div style={{ paddingTop: '64px', textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem' }}>Event not found.</div>;

  return (
    <>
      <Helmet>
        <title>{event.title} — Code829</title>
        <meta name="description" content={event.description.slice(0, 160)} />
      </Helmet>

      <div style={{ paddingTop: '64px' }}>
        <ParallaxHero event={event} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 1.5rem 6rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 400px)',
            gap: '3rem',
            alignItems: 'start',
          }}>
            {/* LEFT: 60% — event details */}
            <div>
              {/* Quick meta */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1.25rem',
                marginBottom: '2rem',
                paddingBottom: '2rem',
                borderBottom: '1px solid var(--border)',
              }}>
                {[
                  { Icon: Calendar, label: new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) },
                  { Icon: Clock, label: new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
                  { Icon: MapPin, label: `${event.venue}, ${event.city}` },
                  { Icon: Users, label: `${event.attendeeCount.toLocaleString()} attending` },
                ].map(({ Icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <Icon size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                    {label}
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
                <button
                  onClick={() => setSaved((v) => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border)',
                    background: saved ? 'color-mix(in srgb, var(--color-pink) 12%, transparent)' : 'var(--bg-secondary)',
                    color: saved ? 'var(--color-pink)' : 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    transition: 'all 0.2s',
                  }}
                >
                  <Heart size={14} style={{ color: saved ? 'var(--color-pink)' : 'inherit' }} fill={saved ? 'var(--color-pink)' : 'none'} />
                  {saved ? 'Saved' : 'Save'}
                </button>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <Share2 size={14} /> Share
                </button>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem',
                }}>
                  About This Event
                </h2>
                {event.description.split('\n\n').map((para, i) => (
                  <p key={i} style={{
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    marginBottom: '1rem',
                    fontSize: '0.95rem',
                  }}>
                    {para}
                  </p>
                ))}
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                {event.tags.map((tag) => (
                  <span key={tag} style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '999px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Venue */}
              <div style={{
                padding: '1.25rem',
                borderRadius: '1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  Venue
                </h3>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <MapPin size={14} style={{ color: 'var(--accent-primary)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.2rem', fontSize: '0.9rem' }}>{event.venue}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>{event.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: 40% — sticky sidebar */}
            <div style={{ position: 'sticky', top: '80px' }}>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '1.25rem',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-card)',
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '1.25rem',
                }}>
                  Get Tickets
                </h3>

                <SocialProof event={event} />

                {/* Ticket tiers */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {event.tickets.map((tier) => (
                    <TicketCard
                      key={tier.id}
                      tier={tier}
                      selected={selectedTier === tier.id}
                      onSelect={() => setSelectedTier(tier.id)}
                    />
                  ))}
                </div>

                {/* Quantity */}
                {selectedTierData && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.25rem',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '0.75rem',
                  }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Quantity</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >−</button>
                      <span style={{ fontWeight: 700, minWidth: '1.5rem', textAlign: 'center', color: 'var(--text-primary)' }}>
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                        style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >+</button>
                    </div>
                  </div>
                )}

                {/* Total */}
                {selectedTierData && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem',
                    paddingBottom: '1.25rem',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total</span>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: 'var(--accent-cta)',
                    }}>
                      {totalPrice === 0 ? 'Free' : `$${totalPrice}`}
                    </span>
                  </div>
                )}

                {/* CTA */}
                {isAuthenticated ? (
                  <MagneticButton
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={!selectedTier}
                  >
                    Book Now
                  </MagneticButton>
                ) : (
                  <Link
                    to="/auth/login"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.85rem',
                      borderRadius: '0.75rem',
                      background: 'var(--accent-cta)',
                      color: 'var(--bg-primary)',
                      textAlign: 'center',
                      fontWeight: 700,
                      textDecoration: 'none',
                      fontSize: '1rem',
                    }}
                  >
                    Login to Book
                  </Link>
                )}

                <p style={{
                  textAlign: 'center',
                  fontSize: '0.72rem',
                  color: 'var(--text-tertiary)',
                  marginTop: '0.75rem',
                }}>
                  Free cancellation within 24 hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div style={{
        display: 'none', // shown via media query in-page style
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border)',
        padding: '1rem 1.5rem',
        zIndex: 80,
      }}
        className="mobile-booking-bar"
      >
        <style>{`
          @media (max-width: 768px) {
            .mobile-booking-bar { display: flex !important; align-items: center; gap: 1rem; }
          }
        `}</style>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>From</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cta)' }}>
            ${event.tickets[0]?.price ?? 0}
          </div>
        </div>
        <MagneticButton style={{ flex: 1, justifyContent: 'center' }}>
          Get Tickets
        </MagneticButton>
      </div>
    </>
  );
}
