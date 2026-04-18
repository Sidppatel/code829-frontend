import type { CSSProperties } from 'react';
import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { EventSummary } from '../../types/event';
import { formatEventDate } from '../../utils/date';
import EventImageFallback from './EventImageFallback';
import DisplayHeading from '../ui/DisplayHeading';
import StatusBadge, { type StatusKind } from '../ui/StatusBadge';
import MetaRow from '../ui/MetaRow';
import ProgressBar from '../ui/ProgressBar';

interface Props {
  event: EventSummary;
  onClick?: () => void;
  variant?: 'default' | 'compact';
}

function resolvePill(event: EventSummary): { kind: StatusKind; label: string } {
  if (event.isSoldOut) return { kind: 'soldout', label: 'Sold out' };
  if (event.layoutMode === 'Grid') return { kind: 'published', label: 'Table' };
  return { kind: 'completed', label: 'Open' };
}

export default function EventCard({ event, onClick, variant = 'default' }: Props) {
  const priceLabel = event.displayFromFormatted ?? 'Free';
  const venueName = event.venueName || event.venue?.name || 'Virtual';
  const venueCity = event.venueCity || event.venue?.city;
  const venueLine = venueCity ? `${venueName} · ${venueCity}` : venueName;
  const pill = resolvePill(event);

  const imageHeight = variant === 'compact' ? 160 : 200;
  const cardStyle: CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : 'default',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-sm)',
  };

  return (
    <div onClick={onClick} className="c829-card-hover" style={cardStyle}>
      <div
        style={{
          position: 'relative',
          height: imageHeight,
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
          padding: variant === 'compact' ? 16 : 20,
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
          <DisplayHeading as="h3" size="sm" style={{ flex: 1 }}>
            {event.title}
          </DisplayHeading>
          <StatusBadge kind={pill.kind}>{pill.label}</StatusBadge>
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

        <MetaRow
          items={[
            {
              key: 'date',
              icon: <CalendarOutlined style={{ fontSize: 13 }} />,
              label: formatEventDate(event.startDate),
            },
            {
              key: 'venue',
              icon: <EnvironmentOutlined style={{ fontSize: 13 }} />,
              label: venueLine,
            },
          ]}
          style={{ marginBottom: 16 }}
        />

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
            <DisplayHeading as="div" size="sm">
              {priceLabel}
            </DisplayHeading>
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
            <ProgressBar current={event.totalSold || 0} total={event.totalCapacity || 1} height={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
