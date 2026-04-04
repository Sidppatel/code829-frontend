export type TicketStatus = 'Unassigned' | 'Invited' | 'Claimed' | 'CheckedIn';

export interface BookingTicket {
  id: string;
  ticketCode: string;
  seatNumber: number;
  status: TicketStatus;
  bookingId: string;
  bookingNumber: string;
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
}

export interface GuestTicket {
  id: string;
  ticketCode: string;
  seatNumber: number;
  status: TicketStatus;
  eventTitle: string;
  eventDate: string;
  venueName: string;
  tableLabel?: string;
  bookingNumber: string;
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
