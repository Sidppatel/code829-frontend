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
  items: BookingItem[];
  payment?: PaymentInfo;
  createdAt: string;
}

export type BookingDetail = Booking;

export type BookingStatus = 'Pending' | 'Paid' | 'CheckedIn' | 'Cancelled' | 'Refunded';

export interface BookingItem {
  id: string;
  ticketTypeId: string;
  ticketTypeName: string;
  seatId?: string;
  seatLabel?: string;
  tableLabel?: string;
  priceCents: number;
  qrToken: string;
  guestName?: string;
  guestEmail?: string;
  invitationToken?: string;
  isCheckedIn: boolean;
}

export interface PaymentInfo {
  id: string;
  paymentIntentId?: string;
  status: string;
  amountCents: number;
  paidAt?: string;
  refundedAt?: string;
}
