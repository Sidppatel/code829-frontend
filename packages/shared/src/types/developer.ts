export interface DashboardStats {
  totalEvents: number;
  totalBookings: number;
  totalRevenueCents: number;
  totalUsers: number;
  upcomingEvents: number;
  recentBookings: number;
}

export interface NextEventDashboard {
  eventId: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  startDate: string;
  endDate: string;
  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  imagePath: string | null;
  layoutMode: string;
  daysUntil: number;
  totalBookings: number;
  paidBookings: number;
  checkedInBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  refundedBookings: number;
  revenueCents: number;
  potentialRevenueCents: number;
  totalCapacity: number;
  soldCount: number;
  recentBookings: unknown[];
}
