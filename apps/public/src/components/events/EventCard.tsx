import { useNavigate } from 'react-router-dom';
import SharedEventCard from '@code829/shared/components/events/EventCard';
import type { EventSummary } from '@code829/shared/types/event';

interface Props {
  event: EventSummary;
  variant?: 'default' | 'compact';
}

/** Thin wrapper that wires the shared EventCard into public-app navigation. */
export default function EventCard({ event, variant }: Props) {
  const navigate = useNavigate();
  return (
    <SharedEventCard
      event={event}
      variant={variant}
      onClick={() => navigate(`/events/${event.slug}`)}
    />
  );
}
