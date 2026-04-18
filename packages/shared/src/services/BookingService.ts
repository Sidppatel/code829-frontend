import { BaseService } from './BaseService';
import type { Booking } from '../types/booking';
import type { PagedResponse } from '../types/shared';
import type { PricingQuote, PricingQuoteRequest } from '../types/pricing';
import type { TableLock } from '../types/layout';

export interface CreateBookingRequest {
  eventId: string;
  tableId?: string;
  tableIds?: string[];
  seatsReserved?: number;
  eventTicketTypeId?: string;
}

export interface AdminBookingListParams extends Record<string, unknown> {
  page?: number;
  pageSize?: number;
  status?: string;
  eventId?: string;
  search?: string;
}

export class BookingService extends BaseService {
  private static _instance: BookingService | null = null;
  static getInstance(): BookingService {
    return (this._instance ??= new BookingService());
  }
  private constructor() {
    super('BookingService');
  }

  // ── User bookings ──────────────────────────────
  create = (request: CreateBookingRequest) => this.post<Booking>('/bookings', request);

  confirmPayment = (id: string) => this.post<Booking>(`/bookings/${id}/confirm`);

  confirmByPaymentIntent = (paymentIntentId: string) =>
    this.post<Booking>('/bookings/confirm-by-intent', { paymentIntentId });

  cancel = (id: string) => this.post<Booking>(`/bookings/${id}/cancel`);

  getById = (id: string) => this.get<Booking>(`/bookings/${id}`);

  getMine = (page = 1, pageSize = 20, search?: string) =>
    this.get<PagedResponse<Booking>>('/bookings/mine', {
      params: { page, pageSize, search: search || undefined },
    });

  getQrCode = (id: string) =>
    this.get(`/bookings/${id}/qr`, { responseType: 'blob' });

  getStripeConfig = () =>
    this.get<{ publishableKey: string; mode: 'live' | 'test' }>('/bookings/stripe-config');

  getQuote = (request: PricingQuoteRequest) =>
    this.post<PricingQuote>('/bookings/quote', request);

  // ── Admin bookings ─────────────────────────────
  adminList = (params?: AdminBookingListParams) =>
    this.get<PagedResponse<Booking>>('/admin/bookings', { params });

  adminGetStats = (eventId?: string) =>
    this.get('/admin/bookings/stats', { params: eventId ? { eventId } : {} });

  refund = (id: string) => this.post(`/admin/bookings/${id}/refund`);

  exportCsv = (eventId?: string) =>
    this.get('/admin/bookings/export/csv', {
      params: eventId ? { eventId } : {},
      responseType: 'blob',
    });

  exportXlsx = (eventId?: string) =>
    this.get('/admin/bookings/export/xlsx', {
      params: eventId ? { eventId } : {},
      responseType: 'blob',
    });

  // ── Table locking ──────────────────────────────
  lockTable = (eventId: string, tableId: string) =>
    this.post<TableLock>('/tables/lock', { eventId, tableId });

  releaseTable = (eventId: string, tableId: string) =>
    this.post<{ message: string }>('/tables/release', { eventId, tableId });

  getMyLocks = (eventId: string) =>
    this.get<TableLock[]>(`/tables/my-locks/${eventId}`);
}

export const bookingService = BookingService.getInstance();
