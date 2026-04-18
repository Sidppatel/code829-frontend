export interface ScanResponse {
  success: boolean;
  message: string;
  purchaseNumber?: string;
  userName?: string;
  eventTitle?: string;
  status?: string;
  itemCount?: number;
  checkedInAt?: string;
}

export interface CheckInStats {
  eventId: string;
  eventTitle: string;
  totalTicketsSold: number;
  checkedIn: number;
  pending: number;
  remaining: number;
  percentage: number;
  lastCheckIn?: string;
}
