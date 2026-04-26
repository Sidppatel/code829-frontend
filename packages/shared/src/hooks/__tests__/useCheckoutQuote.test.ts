import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCheckoutQuote } from '../useCheckoutQuote';
import type { PricingQuoteRequest, CheckoutQuote } from '../../types/pricing';

vi.mock('../../controllers/PurchaseController', () => ({
  purchaseController: {
    getCheckoutQuote: vi.fn(),
  },
  PurchaseController: class {},
}));

import { purchaseController } from '../../controllers/PurchaseController';
const mockGetCheckoutQuote = vi.mocked(purchaseController.getCheckoutQuote);

const mockQuote: CheckoutQuote = {
  displayTotalCents: 2100,
  taxCents: 168,
  grandTotalCents: 2268,
  seatsIncluded: 2,
  currency: 'usd',
  formattedDisplayTotal: '$21.00',
  formattedTax: '$1.68',
  formattedGrandTotal: '$22.68',
  taxCalculationId: 'tx_test_1',
  expiresAt: '2026-04-23T12:00:00Z',
};

const selection: PricingQuoteRequest = {
  eventId: 'event-1',
  seatCount: 2,
  eventTicketTypeId: 'tt-1',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useCheckoutQuote', () => {
  it('starts with null quote and isLoading false', () => {
    mockGetCheckoutQuote.mockResolvedValue(mockQuote);
    const { result } = renderHook(() => useCheckoutQuote(null));
    expect(result.current.quote).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('does not fetch when selection is null', async () => {
    const { result } = renderHook(() => useCheckoutQuote(null));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockGetCheckoutQuote).not.toHaveBeenCalled();
    expect(result.current.quote).toBeNull();
  });

  it('fetches checkout quote when selection has seatCount', async () => {
    mockGetCheckoutQuote.mockResolvedValueOnce(mockQuote);
    const { result } = renderHook(() => useCheckoutQuote(selection));
    await waitFor(() => expect(result.current.quote).toEqual(mockQuote));
    expect(mockGetCheckoutQuote).toHaveBeenCalledWith(selection);
  });

  it('sets error when fetch fails', async () => {
    mockGetCheckoutQuote.mockRejectedValueOnce({
      response: { data: { message: 'Pricing unavailable' } },
    });
    const { result } = renderHook(() => useCheckoutQuote(selection));
    await waitFor(() => expect(result.current.error).toBe('Pricing unavailable'));
    expect(result.current.quote).toBeNull();
  });

  it('uses fallback error message when response has no message', async () => {
    mockGetCheckoutQuote.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useCheckoutQuote(selection));
    await waitFor(() => expect(result.current.error).toBe('Unable to calculate pricing'));
  });

  it('refresh triggers a new fetch', async () => {
    mockGetCheckoutQuote.mockResolvedValue(mockQuote);
    const { result } = renderHook(() => useCheckoutQuote(selection));
    await waitFor(() => expect(result.current.quote).toEqual(mockQuote));

    mockGetCheckoutQuote.mockResolvedValueOnce({ ...mockQuote, grandTotalCents: 9999 });
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.quote?.grandTotalCents).toBe(9999));
  });

  it('does not fetch when selection has no seats or tables', async () => {
    const emptySelection: PricingQuoteRequest = { eventId: 'ev-1' };
    const { result } = renderHook(() => useCheckoutQuote(emptySelection));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockGetCheckoutQuote).not.toHaveBeenCalled();
  });
});
