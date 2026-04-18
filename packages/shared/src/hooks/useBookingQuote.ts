import { useBookingQuoteVM } from '../viewmodels/BookingQuoteViewModel';
import type { PricingQuote, PricingQuoteRequest } from '../types/pricing';

interface UseBookingQuoteResult {
  quote: PricingQuote | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Thin wrapper around BookingQuoteViewModel so existing callers keep working
 * after Phase 1. The backend remains the single source of truth for totals.
 */
export function useBookingQuote(selection: PricingQuoteRequest | null): UseBookingQuoteResult {
  const { quote, isLoading, error, refresh } = useBookingQuoteVM(selection);
  return { quote, isLoading, error, refresh };
}
