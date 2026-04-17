import apiClient from '../lib/axios';
import type { Booking } from '../types/booking';
import type { PagedResponse } from '../types/shared';
import type { PricingQuote, PricingQuoteRequest } from '../types/pricing';

export interface CreateBookingRequest {
  eventId: string;
  tableId?: string;
  tableIds?: string[];
  seatsReserved?: number;
  eventTicketTypeId?: string;
}

export const bookingsApi = {
  create: (request: CreateBookingRequest) =>
    apiClient.post<Booking>('/bookings', request),

  confirmPayment: (id: string) =>
    apiClient.post<Booking>(`/bookings/${id}/confirm`),

  confirmByPaymentIntent: (paymentIntentId: string) =>
    apiClient.post<Booking>('/bookings/confirm-by-intent', { paymentIntentId }),

  cancel: (id: string) =>
    apiClient.post<Booking>(`/bookings/${id}/cancel`),

  getById: (id: string) =>
    apiClient.get<Booking>(`/bookings/${id}`),

  getMine: (page = 1, pageSize = 20, search?: string) =>
    apiClient.get<PagedResponse<Booking>>('/bookings/mine', { params: { page, pageSize, search: search || undefined } }),

  getQrCode: (id: string) =>
    apiClient.get(`/bookings/${id}/qr`, { responseType: 'blob' }),

  getStripeConfig: () =>
    apiClient.get<{ publishableKey: string; mode: 'live' | 'test' }>('/bookings/stripe-config'),

  getQuote: (request: PricingQuoteRequest) =>
    apiClient.post<PricingQuote>('/bookings/quote', request),
};
