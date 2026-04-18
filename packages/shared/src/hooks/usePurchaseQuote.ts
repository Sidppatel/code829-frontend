import { usePurchaseQuoteVM } from '../viewmodels/PurchaseQuoteViewModel';
import type { PricingQuote, PricingQuoteRequest } from '../types/pricing';

interface UsePurchaseQuoteResult {
  quote: PricingQuote | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function usePurchaseQuote(selection: PricingQuoteRequest | null): UsePurchaseQuoteResult {
  const { quote, isLoading, error, refresh } = usePurchaseQuoteVM(selection);
  return { quote, isLoading, error, refresh };
}
