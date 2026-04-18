export interface DashboardStats {
  totalEvents: number;
  totalPurchases: number;
  totalRevenueCents: number;
  totalUsers: number;
  publishedEvents: number;
  recentPurchases: number;
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
  totalPurchases: number;
  paidPurchases: number;
  checkedInPurchases: number;
  pendingPurchases: number;
  cancelledPurchases: number;
  refundedPurchases: number;
  revenueCents: number;
  potentialRevenueCents: number;
  totalCapacity: number;
  soldCount: number;
  recentPurchases: unknown[];
}
