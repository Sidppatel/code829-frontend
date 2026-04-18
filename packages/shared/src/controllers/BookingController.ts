import { BaseController } from './BaseController';
import {
  bookingService,
  BookingService,
  type CreateBookingRequest,
  type AdminBookingListParams,
} from '../services/BookingService';
import type { PricingQuote, PricingQuoteRequest } from '../types/pricing';

export class BookingController extends BaseController {
  private static _instance: BookingController | null = null;
  static getInstance(): BookingController {
    return (this._instance ??= new BookingController());
  }
  private readonly svc: BookingService;
  private constructor(svc: BookingService = bookingService) {
    super();
    this.svc = svc;
  }

  getQuote = async (request: PricingQuoteRequest): Promise<PricingQuote> =>
    (await this.svc.getQuote(request)).data;

  async create(request: CreateBookingRequest) {
    const { data } = await this.svc.create(request);
    this.emit('booking:created', data);
    return data;
  }

  async confirmPayment(id: string) {
    const { data } = await this.svc.confirmPayment(id);
    this.emit('booking:confirmed', data);
    return data;
  }

  async confirmByPaymentIntent(paymentIntentId: string) {
    const { data } = await this.svc.confirmByPaymentIntent(paymentIntentId);
    this.emit('booking:confirmed', data);
    return data;
  }

  async cancel(id: string) {
    const { data } = await this.svc.cancel(id);
    this.emit('booking:cancelled', data);
    return data;
  }

  getById = async (id: string) => (await this.svc.getById(id)).data;
  getMine = async (page = 1, pageSize = 20, search?: string) =>
    (await this.svc.getMine(page, pageSize, search)).data;

  // Admin
  adminList = async (params?: AdminBookingListParams) => (await this.svc.adminList(params)).data;

  async refund(id: string) {
    const { data } = await this.svc.refund(id);
    this.emit('booking:refunded', { id });
    return data;
  }

  // Table locking
  lockTable = async (eventId: string, tableId: string) =>
    (await this.svc.lockTable(eventId, tableId)).data;
  releaseTable = async (eventId: string, tableId: string) =>
    (await this.svc.releaseTable(eventId, tableId)).data;
  getMyLocks = async (eventId: string) => (await this.svc.getMyLocks(eventId)).data;
}

export const bookingController = BookingController.getInstance();
