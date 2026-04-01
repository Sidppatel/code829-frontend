export interface ScanResponse {
  success: boolean;
  message: string;
  bookingNumber?: string;
  userName?: string;
  eventTitle?: string;
  status?: string;
  itemCount?: number;
  checkedInAt?: string;
}

export interface CheckInStats {
  eventId: string;
  eventTitle: string;
  total: number;
  checkedIn: number;
  pending: number;
  paid: number;
  percentage: number;
  totalTicketsSold: number;
  lastCheckIn?: string;
}
