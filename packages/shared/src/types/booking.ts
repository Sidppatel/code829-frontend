export interface Booking {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  userId: string;
  userName: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventEndDate?: string;
  eventCategory?: string;
  eventImagePath?: string;
  venueName?: string;
  venueAddress?: string;
  subtotalCents: number;
  feeCents: number;
  totalCents: number;
  qrToken: string;
  tableId?: string;
  tableLabel?: string;
  seatsReserved?: number;
  ticketCount: number;
  transaction?: StripeTransactionInfo;
  createdAt: string;
  clientSecret?: string;
}
export type BookingStatus = 'Pending' | 'Paid' | 'CheckedIn' | 'Cancelled' | 'Refunded' | 'Expired';

export interface StripeTransactionInfo {
  id: string;
  paymentIntentId: string;
  status: string;
  amountCents: number;
  totalChargedCents?: number;
  taxAmountCents?: number;
  stripeFeesCents?: number;
  transferAmountCents?: number;
  paidAt?: string;
  refundedAt?: string;
}
