import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../services/eventsApi';
import type { EventSummary } from '../types/event';

export interface UseHomepageEventsResult {
  featured: EventSummary[];
  upcoming: EventSummary[];
  loading: boolean;
  error: string | null;
}

export function useHomepageEvents(): UseHomepageEventsResult {
  const featuredQ = useQuery({
    queryKey: ['events', 'home', 'featured'],
    queryFn: async () => (await eventsApi.list({ pageSize: 4 })).data.items.filter((e) => e.isFeatured),
  });
  const upcomingQ = useQuery({
    queryKey: ['events', 'home', 'upcoming'],
    queryFn: async () => (await eventsApi.list({ pageSize: 6 })).data.items,
  });
  const error = featuredQ.error ?? upcomingQ.error;
  return {
    featured: featuredQ.data ?? [],
    upcoming: upcomingQ.data ?? [],
    loading: featuredQ.isPending || upcomingQ.isPending,
    error: error ? (error instanceof Error ? error.message : 'Failed to load events') : null,
  };
}
