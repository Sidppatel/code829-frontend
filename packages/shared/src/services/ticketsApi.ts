import { ticketService } from './TicketService';

export const ticketsApi = {
  getForBooking: ticketService.getForBooking,
  getTicketQr: ticketService.getTicketQr,
  invite: ticketService.invite,
  revoke: ticketService.revoke,
  claimSelf: ticketService.claimSelf,
  getClaimInfo: ticketService.getClaimInfo,
  claim: ticketService.claim,
  getMine: ticketService.getMine,
  getMyTicketQr: ticketService.getMyTicketQr,
};
