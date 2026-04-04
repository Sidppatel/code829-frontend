export interface Booking {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  userId: string;
  userName: string;
  eventId: string;
  eventTitle: string;
  subtotalCents: number;
  feeCents: number;
  totalCents: number;
  qrToken: string;
  tableId?: string;
  tableLabel?: string;
  seatsReserved?: number;
  payment?: PaymentInfo;
  createdAt: string;
  clientSecret?: string;
}
export type BookingStatus = 'Pending' | 'Paid' | 'CheckedIn' | 'Cancelled' | 'Refunded' | 'Expired';

export interface PaymentInfo {
  id: string;
  paymentIntentId?: string;
  status: string;
  amountCents: number;
  paidAt?: string;
  refundedAt?: string;
}
