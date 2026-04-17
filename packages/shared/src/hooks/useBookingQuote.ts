import { useEffect, useRef, useState } from 'react';
import { bookingsApi } from '../services/bookingsApi';
import type { PricingQuote, PricingQuoteRequest } from '../types/pricing';
import { createLogger } from '../lib/logger';

const log = createLogger('useBookingQuote');

interface UseBookingQuoteResult {
  quote: PricingQuote | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetches an authoritative pricing quote from the backend whenever the selection changes.
 * The frontend never computes totals itself — the backend is the single source of truth.
 * Pass a null selection (e.g., when no tables/seats chosen yet) to clear the quote.
 */
export function useBookingQuote(selection: PricingQuoteRequest | null): UseBookingQuoteResult {
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const lastRequestRef = useRef<string>('');

  useEffect(() => {
    if (!selection) {
      setQuote(null);
      setError(null);
      return;
    }

    const hasSelection = (selection.tableIds && selection.tableIds.length > 0) || (selection.seatCount && selection.seatCount > 0);
    if (!hasSelection) {
      setQuote(null);
      setError(null);
      return;
    }

    const key = JSON.stringify(selection);
    lastRequestRef.current = key;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    bookingsApi.getQuote(selection)
      .then(({ data }) => {
        if (cancelled || lastRequestRef.current !== key) return;
        setQuote(data);
      })
      .catch((err: unknown) => {
        if (cancelled || lastRequestRef.current !== key) return;
        log.error('Failed to fetch booking quote', { err });
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unable to calculate pricing';
        setError(msg);
        setQuote(null);
      })
      .finally(() => {
        if (cancelled || lastRequestRef.current !== key) return;
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [selection, refreshKey]);

  return { quote, isLoading, error, refresh: () => setRefreshKey(k => k + 1) };
}
