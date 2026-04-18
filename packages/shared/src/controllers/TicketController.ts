import { BaseController } from './BaseController';
import { ticketService, TicketService } from '../services/TicketService';

export class TicketController extends BaseController {
  private static _instance: TicketController | null = null;
  static getInstance(): TicketController {
    return (this._instance ??= new TicketController());
  }
  private readonly svc: TicketService;
  private constructor(svc: TicketService = ticketService) {
    super();
    this.svc = svc;
  }

  getForBooking = async (bookingId: string) =>
    (await this.svc.getForBooking(bookingId)).data;

  getMine = async () => (await this.svc.getMine()).data;

  async invite(bookingId: string, ticketId: string, email: string, guestName?: string) {
    await this.svc.invite(bookingId, ticketId, email, guestName);
    this.emit('ticket:invited', { bookingId, ticketId, email });
  }

  async revoke(bookingId: string, ticketId: string) {
    await this.svc.revoke(bookingId, ticketId);
    this.emit('ticket:revoked', { bookingId, ticketId });
  }

  async claimSelf(bookingId: string, ticketId: string) {
    const { data } = await this.svc.claimSelf(bookingId, ticketId);
    this.emit('ticket:claimed', { bookingId, ticketId });
    return data;
  }

  getClaimInfo = async (token: string) => (await this.svc.getClaimInfo(token)).data;

  async claim(token: string) {
    const { data } = await this.svc.claim(token);
    this.emit('ticket:claimed', data);
    return data;
  }
}

export const ticketController = TicketController.getInstance();
