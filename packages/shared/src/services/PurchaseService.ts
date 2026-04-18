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
  create = (request: CreatePurchaseRequest) => this.post<Purchase>('/purchases', request);

  confirmPayment = (id: string) => this.post<Purchase>(`/purchases/${id}/confirm`);

  confirmByPaymentIntent = (paymentIntentId: string) =>
    this.post<Purchase>('/purchases/confirm-by-intent', { paymentIntentId });

  cancel = (id: string) => this.post<Purchase>(`/purchases/${id}/cancel`);

  getById = (id: string) => this.get<Purchase>(`/purchases/${id}`);

  getMine = (page = 1, pageSize = 20, search?: string) =>
    this.get<PagedResponse<Purchase>>('/purchases/mine', {
      params: { page, pageSize, search: search || undefined },
    });

  getQrCode = (id: string) =>
    this.get(`/purchases/${id}/qr`, { responseType: 'blob' });

  getStripeConfig = () =>
    this.get<{ publishableKey: string; mode: 'live' | 'test' }>('/purchases/stripe-config');

  getQuote = (request: PricingQuoteRequest) =>
    this.post<PricingQuote>('/purchases/quote', request);

  // ── Admin purchases ─────────────────────────────
  adminList = (params?: AdminPurchaseListParams) =>
    this.get<PagedResponse<Purchase>>('/admin/purchases', { params });

  adminGetStats = (eventId?: string) =>
    this.get('/admin/purchases/stats', { params: eventId ? { eventId } : {} });

  refund = (id: string) => this.post(`/admin/purchases/${id}/refund`);

  exportCsv = (eventId?: string) =>
    this.get('/admin/purchases/export/csv', {
      params: eventId ? { eventId } : {},
      responseType: 'blob',
    });

  exportXlsx = (eventId?: string) =>
    this.get('/admin/purchases/export/xlsx', {
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
