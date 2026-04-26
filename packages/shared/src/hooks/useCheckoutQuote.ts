import { useCheckoutQuoteVM } from '../viewmodels/CheckoutQuoteViewModel';
import type { CheckoutQuote, PricingQuoteRequest } from '../types/pricing';

interface UseCheckoutQuoteResult {
  quote: CheckoutQuote | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useCheckoutQuote(selection: PricingQuoteRequest | null): UseCheckoutQuoteResult {
  const { quote, isLoading, error, refresh } = useCheckoutQuoteVM(selection);
  return { quote, isLoading, error, refresh };
}
