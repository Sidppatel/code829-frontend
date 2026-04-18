export interface Purchase {
  id: string;
  bookingNumber: string;
  status: PurchaseStatus;
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
  totalCents: number;
  feeCents?: number;
  qrToken: string;
  tableId?: string;
  tableLabel?: string;
  seatsReserved?: number;
  ticketCount: number;
  transaction?: StripeTransactionInfo;
  createdAt: string;
  clientSecret?: string;
}
export type PurchaseStatus = 'Pending' | 'Paid' | 'CheckedIn' | 'Cancelled' | 'Refunded' | 'Expired';

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
