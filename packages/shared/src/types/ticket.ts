export type TicketStatus = 'Unassigned' | 'Invited' | 'Claimed' | 'CheckedIn';

export interface PurchaseTicket {
  id: string;
  ticketCode: string;
  seatNumber: number;
  status: TicketStatus;
  purchaseId: string;
  purchaseNumber: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  venueName: string;
  tableLabel?: string;
  guestName?: string;
  guestEmail?: string;
  invitedEmail?: string;
  inviteSentAt?: string;
  claimedAt?: string;
  guestUserId?: string;
}

export interface GuestTicket {
  purchaseTicketId: string;
  ticketCode: string;
  seatNumber: number;
  status: TicketStatus;
  eventTitle: string;
  eventDate: string;
  venueName: string;
  tableLabel?: string;
  purchaseNumber: string;
  claimedAt?: string;
}

export interface TicketClaimInfo {
  ticketId: string;
  ticketCode: string;
  seatNumber: number;
  eventTitle: string;
  eventDate: string;
  venueName: string;
  tableLabel?: string;
  inviterName: string;
  alreadyClaimed: boolean;
}
