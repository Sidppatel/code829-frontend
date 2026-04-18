import { BaseService } from './BaseService';
import type { PurchaseTicket, GuestTicket, TicketClaimInfo } from '../types/ticket';

export class TicketService extends BaseService {
  private static _instance: TicketService | null = null;
  static getInstance(): TicketService {
    return (this._instance ??= new TicketService());
  }
  private constructor() {
    super('TicketService');
  }

  getForBooking = (bookingId: string) =>
    this.get<PurchaseTicket[]>(`/bookings/${bookingId}/tickets`);

  getTicketQr = (bookingId: string, ticketId: string) =>
    this.get(`/bookings/${bookingId}/tickets/${ticketId}/qr`, { responseType: 'blob' });

  invite = (bookingId: string, ticketId: string, email: string, guestName?: string) =>
    this.post(`/bookings/${bookingId}/tickets/${ticketId}/invite`, { email, guestName });

  revoke = (bookingId: string, ticketId: string) =>
    this.post(`/bookings/${bookingId}/tickets/${ticketId}/revoke`);

  claimSelf = (bookingId: string, ticketId: string) =>
    this.post<{ message: string; ticketId: string }>(
      `/bookings/${bookingId}/tickets/${ticketId}/claim-self`,
    );

  getClaimInfo = (token: string) =>
    this.get<TicketClaimInfo>('/tickets/claim', { params: { token } });

  claim = (token: string) =>
    this.post<{ message: string; ticketId: string }>('/tickets/claim', { token });

  getMine = () => this.get<GuestTicket[]>('/tickets/mine');

  getMyTicketQr = (ticketId: string) =>
    this.get(`/tickets/${ticketId}/qr`, { responseType: 'blob' });
}

export const ticketService = TicketService.getInstance();
