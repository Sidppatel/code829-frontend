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
  eventTitle: string;
  startDate: string;
  venueName: string;
  ticketsSold: number;
  ticketsTotal: number;
  revenueCents: number;
}
