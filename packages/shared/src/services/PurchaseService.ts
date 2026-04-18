import { BaseService } from './BaseService';
import type { Purchase } from '../types/purchase';
import type { PagedResponse } from '../types/shared';
import type { PricingQuote, PricingQuoteRequest } from '../types/pricing';
import type { TableLock } from '../types/layout';

export interface CreatePurchaseRequest {
  eventId: string;
  tableId?: string;
  tableIds?: string[];
  seatsReserved?: number;
  eventTicketTypeId?: string;
}

export interface AdminPurchaseListParams extends Record<string, unknown> {
  page?: number;
  pageSize?: number;
  status?: string;
  eventId?: string;
  search?: string;
}

export class PurchaseService extends BaseService {
  private static _instance: PurchaseService | null = null;
  static getInstance(): PurchaseService {
    return (this._instance ??= new PurchaseService());
  }
  private constructor() {
    super('PurchaseService');
  }

  // ── User purchases ──────────────────────────────
  create = (request: CreatePurchaseRequest) => this.post<Purchase>('/bookings', request);

  confirmPayment = (id: string) => this.post<Purchase>(`/bookings/${id}/confirm`);

  confirmByPaymentIntent = (paymentIntentId: string) =>
    this.post<Purchase>('/bookings/confirm-by-intent', { paymentIntentId });

  cancel = (id: string) => this.post<Purchase>(`/bookings/${id}/cancel`);

  getById = (id: string) => this.get<Purchase>(`/bookings/${id}`);

  getMine = (page = 1, pageSize = 20, search?: string) =>
    this.get<PagedResponse<Purchase>>('/bookings/mine', {
      params: { page, pageSize, search: search || undefined },
    });

  getQrCode = (id: string) =>
    this.get(`/bookings/${id}/qr`, { responseType: 'blob' });

  getStripeConfig = () =>
    this.get<{ publishableKey: string; mode: 'live' | 'test' }>('/bookings/stripe-config');

  getQuote = (request: PricingQuoteRequest) =>
    this.post<PricingQuote>('/bookings/quote', request);

  // ── Admin purchases ─────────────────────────────
  adminList = (params?: AdminPurchaseListParams) =>
    this.get<PagedResponse<Purchase>>('/admin/bookings', { params });

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

export const purchaseService = PurchaseService.getInstance();
