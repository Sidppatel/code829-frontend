import { useEffect, useState } from 'react';
import { eventsApi } from '../services/eventsApi';
import type { EventSummary } from '../types/event';
import { createLogger } from '../lib/logger';

const log = createLogger('useHomepageEvents');

export interface UseHomepageEventsResult {
  featured: EventSummary[];
  upcoming: EventSummary[];
  loading: boolean;
  error: string | null;
}

export function useHomepageEvents(): UseHomepageEventsResult {
  const [featured, setFeatured] = useState<EventSummary[]>([]);
  const [upcoming, setUpcoming] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [featRes, upRes] = await Promise.all([
          eventsApi.list({ pageSize: 4 }),
          eventsApi.list({ pageSize: 6 }),
        ]);
        if (cancelled) return;
        const featuredItems = featRes.data.items.filter((e) => e.isFeatured);
        setFeatured(featuredItems);
        setUpcoming(upRes.data.items);
        log.info('Loaded home events', { featured: featuredItems.length, upcoming: upRes.data.items.length });
      } catch (err) {
        if (cancelled) return;
        log.error('Failed to load home events', err);
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  return { featured, upcoming, loading, error };
}
