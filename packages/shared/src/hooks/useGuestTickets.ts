import { useCallback, useEffect, useState } from 'react';
import { ticketsApi } from '../services/ticketsApi';
import type { GuestTicket } from '../types/ticket';
import { createLogger } from '../lib/logger';

const log = createLogger('useGuestTickets');

export interface UseGuestTicketsResult {
  tickets: GuestTicket[];
  error: boolean;
  loading: boolean;
  refresh: () => void;
}

export function useGuestTickets(): UseGuestTicketsResult {
  const [tickets, setTickets] = useState<GuestTicket[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    ticketsApi
      .getMine()
      .then(({ data }) => {
        if (!cancelled) {
          setTickets(data);
          log.info('Loaded guest tickets', { count: data.length });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          log.error('Failed to load guest tickets', err);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { tickets, error, loading, refresh };
}
