import type { CSSProperties } from 'react';
import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { EventSummary } from '@code829/shared/types/event';
import { formatEventDate } from '@code829/shared/utils/date';
import EventImageFallback from './EventImageFallback';

interface Props {
  event: EventSummary;
}

type CSSVars = CSSProperties & { '--c829-sold': number; '--c829-cap': number };

export default function EventCard({ event }: Props) {
  const navigate = useNavigate();

  const priceLabel = event.displayFromFormatted ?? 'Free';
  const isTableLayout = event.layoutMode === 'Grid';
  const pillKind = event.isSoldOut ? 'soldout' : isTableLayout ? 'published' : 'completed';
  const pillLabel = event.isSoldOut ? 'Sold out' : isTableLayout ? 'Table' : 'Open';

  const venueName = event.venueName || event.venue?.name || 'Virtual';
  const venueCity = event.venueCity || event.venue?.city;
  const venueLine = venueCity ? `${venueName} · ${venueCity}` : venueName;

  // CSS vars drive the capacity bar so no arithmetic happens in JSX.
  const cardVars: CSSVars = {
    '--c829-sold': event.totalSold || 0,
    '--c829-cap': event.totalCapacity || 1,
  };

  return (
    <div
      onClick={() => navigate(`/events/${event.slug}`)}
      style={{
        ...cardVars,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: 200,
          overflow: 'hidden',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s var(--ease-human)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        ) : (
          <EventImageFallback category={event.category} title={event.title} />
        )}
      </div>

      <div
        style={{
          padding: 20,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <h3
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
              margin: 0,
              flex: 1,
            }}
          >
            {event.title}
          </h3>
          <span className={`status-pill status-${pillKind}`} style={{ flexShrink: 0 }}>
            <span className="status-pill-dot" />
            {pillLabel}
          </span>
        </div>

        <div
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            marginBottom: 14,
            lineHeight: 1.5,
            minHeight: 20,
          }}
        >
          {event.category}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            fontSize: 12,
            color: 'var(--text-muted)',
            marginBottom: 16,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <CalendarOutlined style={{ fontSize: 13 }} />
            {formatEventDate(event.startDate)}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <EnvironmentOutlined style={{ fontSize: 13 }} />
            {venueLine}
          </span>
        </div>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: 14,
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              From
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {priceLabel}
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                marginBottom: 4,
              }}
            >
              {event.totalSold} of {event.totalCapacity} seated
            </div>
            <div
              style={{
                height: 4,
                background: 'var(--bg-muted)',
                borderRadius: 99,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: 'calc(var(--c829-sold) / var(--c829-cap) * 100%)',
                  height: '100%',
                  background: 'var(--gradient-brand)',
                  transition: 'width 0.4s var(--ease-human)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
