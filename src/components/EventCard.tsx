import React, { useRef, useState } from 'react';
import { MapPin, Calendar, Tag } from 'lucide-react';

export interface EventData {
  id: string;
  title: string;
  category: string;
  venue: string;
  city: string;
  date: string;
  price: number | null;
  imageGradient?: string;
  isFomo?: boolean;
}

interface EventCardProps {
  event: EventData;
  style?: React.CSSProperties;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  Music:
    'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
  Tech: 'linear-gradient(135deg, var(--color-info) 0%, var(--accent-primary) 100%)',
  Art: 'linear-gradient(135deg, var(--color-pink) 0%, var(--accent-secondary) 100%)',
  Food: 'linear-gradient(135deg, var(--accent-cta) 0%, var(--color-yellow) 100%)',
  Sports: 'linear-gradient(135deg, var(--color-success) 0%, var(--color-info) 100%)',
  default:
    'linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-primary) 100%)',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(price: number | null): string {
  if (price === null || price === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function EventCard({ event, style }: EventCardProps): React.ReactElement {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const gradient =
    event.imageGradient ??
    CATEGORY_GRADIENTS[event.category] ??
    CATEGORY_GRADIENTS.default;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>): void {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateY = ((x - cx) / cx) * 8;
    const rotateX = -((y - cy) / cy) * 8;
    const glowX = (x / rect.width) * 100;
    const glowY = (y / rect.height) * 100;
    setTilt({ x: rotateX, y: rotateY });
    setGlow({ x: glowX, y: glowY, opacity: 0.18 });
  }

  function handleMouseLeave(): void {
    setTilt({ x: 0, y: 0 });
    setGlow((g) => ({ ...g, opacity: 0 }));
    setIsHovered(false);
  }

  function handleMouseEnter(): void {
    setIsHovered(true);
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{
        perspective: '1000px',
        ...style,
      }}
      className="flex-shrink-0"
    >
      <div
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovered ? 1.02 : 1})`,
          transition: 'transform 0.18s ease, box-shadow 0.18s ease',
          borderRadius: '1rem',
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          boxShadow: isHovered
            ? 'var(--shadow-card-hover)'
            : 'var(--shadow-card)',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        {/* Radial glow */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            borderRadius: '1rem',
            pointerEvents: 'none',
            background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, var(--accent-primary), transparent 60%)`,
            opacity: glow.opacity,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* Image / gradient placeholder — 3:4 ratio */}
        <div
          style={{
            aspectRatio: '3/4',
            background: gradient,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {event.isFomo && (
            <div
              style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                background: 'var(--accent-cta)',
                color: 'var(--bg-primary)',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '0.2rem 0.55rem',
                borderRadius: '999px',
                zIndex: 3,
              }}
            >
              Almost Full
            </div>
          )}
          {/* Gradient overlay at bottom */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 40%)',
            }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: '1rem', position: 'relative', zIndex: 1 }}>
          {/* Category pill */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              marginBottom: '0.5rem',
            }}
          >
            <Tag size={10} />
            {event.category}
          </span>

          {/* Title */}
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 0.5rem',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {event.title}
          </h3>

          {/* Venue */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.3rem',
            }}
          >
            <MapPin size={12} style={{ flexShrink: 0 }} />
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {event.venue}, {event.city}
            </span>
          </div>

          {/* Date */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.75rem',
            }}
          >
            <Calendar size={12} style={{ flexShrink: 0 }} />
            <span>{formatDate(event.date)}</span>
          </div>

          {/* Price */}
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: event.price === 0 || event.price === null
                ? 'var(--color-success)'
                : 'var(--accent-cta)',
            }}
          >
            {formatPrice(event.price)}
          </div>
        </div>
      </div>
    </div>
  );
}
