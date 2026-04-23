import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePurchaseQuote } from '../usePurchaseQuote';
import type { PricingQuoteRequest, PricingQuote } from '../../types/pricing';

// Mock the PurchaseController used inside the ViewModel
vi.mock('../../controllers/PurchaseController', () => ({
  purchaseController: {
    getQuote: vi.fn(),
  },
  PurchaseController: class {},
}));

import { purchaseController } from '../../controllers/PurchaseController';
const mockGetQuote = vi.mocked(purchaseController.getQuote);

const mockQuote: PricingQuote = {
  subtotalCents: 2000,
  feeCents: 100,
  taxCents: 0,
  totalCents: 2100,
  displaySubtotalCents: 2000,
  seatsIncluded: 2,
  currency: 'USD',
  formattedTotal: '$21.00',
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

describe('usePurchaseQuote', () => {
  it('starts with null quote and isLoading false', () => {
    mockGetQuote.mockResolvedValue(mockQuote);
    const { result } = renderHook(() => usePurchaseQuote(null));
    expect(result.current.quote).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('does not fetch when selection is null', async () => {
    const { result } = renderHook(() => usePurchaseQuote(null));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockGetQuote).not.toHaveBeenCalled();
    expect(result.current.quote).toBeNull();
  });

  it('fetches quote when selection has seatCount', async () => {
    mockGetQuote.mockResolvedValueOnce(mockQuote);
    const { result } = renderHook(() => usePurchaseQuote(selection));
    await waitFor(() => expect(result.current.quote).toEqual(mockQuote));
    expect(mockGetQuote).toHaveBeenCalledWith(selection);
  });

  it('sets error when fetch fails', async () => {
    mockGetQuote.mockRejectedValueOnce({
      response: { data: { message: 'Pricing unavailable' } },
    });
    const { result } = renderHook(() => usePurchaseQuote(selection));
    await waitFor(() => expect(result.current.error).toBe('Pricing unavailable'));
    expect(result.current.quote).toBeNull();
  });

  it('uses fallback error message when response has no message', async () => {
    mockGetQuote.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => usePurchaseQuote(selection));
    await waitFor(() => expect(result.current.error).toBe('Unable to calculate pricing'));
  });

  it('refresh triggers a new fetch', async () => {
    mockGetQuote.mockResolvedValue(mockQuote);
    const { result } = renderHook(() => usePurchaseQuote(selection));
    await waitFor(() => expect(result.current.quote).toEqual(mockQuote));

    mockGetQuote.mockResolvedValueOnce({ ...mockQuote, totalCents: 9999 });
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.quote?.totalCents).toBe(9999));
  });

  it('does not fetch when selection has no seats or tables', async () => {
    const emptySelection: PricingQuoteRequest = { eventId: 'ev-1' };
    const { result } = renderHook(() => usePurchaseQuote(emptySelection));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockGetQuote).not.toHaveBeenCalled();
  });
});
