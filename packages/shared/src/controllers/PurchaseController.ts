import { BaseController } from './BaseController';
import {
  purchaseService,
  PurchaseService,
  type CreatePurchaseRequest,
  type AdminPurchaseListParams,
} from '../services/PurchaseService';
import type { PricingQuote, PricingQuoteRequest } from '../types/pricing';

export class PurchaseController extends BaseController {
  private static _instance: PurchaseController | null = null;
  static getInstance(): PurchaseController {
    return (this._instance ??= new PurchaseController());
  }
  private readonly svc: PurchaseService;
  private constructor(svc: PurchaseService = purchaseService) {
    super();
    this.svc = svc;
  }

  getQuote = async (request: PricingQuoteRequest): Promise<PricingQuote> =>
    (await this.svc.getQuote(request)).data;

  async create(request: CreatePurchaseRequest) {
    const { data } = await this.svc.create(request);
    this.emit('purchase:created', data);
    return data;
  }

  async confirmPayment(id: string) {
    const { data } = await this.svc.confirmPayment(id);
    this.emit('purchase:confirmed', data);
    return data;
  }

  async confirmByPaymentIntent(paymentIntentId: string) {
    const { data } = await this.svc.confirmByPaymentIntent(paymentIntentId);
    this.emit('purchase:confirmed', data);
    return data;
  }

  async cancel(id: string) {
    const { data } = await this.svc.cancel(id);
    this.emit('purchase:cancelled', data);
    return data;
  }

  getById = async (id: string) => (await this.svc.getById(id)).data;
  getMine = async (page = 1, pageSize = 20, search?: string) =>
    (await this.svc.getMine(page, pageSize, search)).data;

  // Admin
  adminList = async (params?: AdminPurchaseListParams) => (await this.svc.adminList(params)).data;

  async refund(id: string) {
    const { data } = await this.svc.refund(id);
    this.emit('purchase:refunded', { id });
    return data;
  }

  // Table locking
  lockTable = async (eventId: string, tableId: string) =>
    (await this.svc.lockTable(eventId, tableId)).data;
  releaseTable = async (eventId: string, tableId: string) =>
    (await this.svc.releaseTable(eventId, tableId)).data;
  getMyLocks = async (eventId: string) => (await this.svc.getMyLocks(eventId)).data;
}

export const purchaseController = PurchaseController.getInstance();
