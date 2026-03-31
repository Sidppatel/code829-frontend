// ---------------------------------------------------------------------------
// Types matching actual API response
// ---------------------------------------------------------------------------
export interface ApiTicketType {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  platformFeeCents: number;
  quantityTotal: number;
  quantitySold: number;
  quantityRemaining: number;
  sortOrder: number;
}

export interface ApiVenue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  capacity: number;
}

export interface ApiEventDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  category: string;
  startDate: string;
  endDate: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  layoutMode: string;
  venueId: string;
  venue: ApiVenue;
  organizerId: string;
  organizerName: string;
  ticketTypes: ApiTicketType[];
  createdAt: string;
}

// Internal display shape
export interface TicketTier {
  id: string;
  name: string;
  priceCents: number;
  totalPriceCents: number;
  description: string;
  available: number;
  total: number;
}

export interface EventDetail {
  id: string;
  title: string;
  category: string;
  description: string;
  layoutMode: string;
  venueName: string;
  venueCity: string;
  venueAddress: string;
  startDate: string;
  endDate: string | null;
  imageUrl: string | null;
  organizer: string;
  attendeeCount: number;
  maxAttendees: number;
  tickets: TicketTier[];
}

export interface SelectedTable {
  id: string;
  label: string;
  priceCents: number;
  capacity: number;
  priceType: string;
  holdExpiresAt: string | null;
}

export function apiToEventDetail(api: ApiEventDetail): EventDetail {
  const totalSold = api.ticketTypes.reduce((sum, t) => sum + t.quantitySold, 0);
  const totalCapacity = api.ticketTypes.reduce(
    (sum, t) => sum + t.quantityTotal,
    0,
  );

  const tickets: TicketTier[] = [...api.ticketTypes]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((t) => ({
      id: t.id,
      name: t.name,
      priceCents: t.priceCents,
      totalPriceCents: t.priceCents + t.platformFeeCents,
      description: t.description,
      available: t.quantityRemaining,
      total: t.quantityTotal,
    }));

  return {
    id: api.id,
    title: api.title,
    category: api.category,
    description: api.description,
    layoutMode: api.layoutMode ?? 'None',
    venueName: api.venue?.name ?? "",
    venueCity: api.venue?.city ?? "",
    venueAddress: api.venue
      ? `${api.venue.address}, ${api.venue.city}, ${api.venue.state} ${api.venue.zipCode}`
      : "",
    startDate: api.startDate,
    endDate: api.endDate,
    imageUrl: api.imageUrl,
    organizer: api.organizerName,
    attendeeCount: totalSold,
    maxAttendees: totalCapacity,
    tickets,
  };
}

export const PLACEHOLDER_EVENT: EventDetail = {
  id: "2",
  title: "React Summit 2026",
  category: "Tech",
  layoutMode: "None",
  description: `Join the world's largest React conference for two days of keynotes, workshops, and networking with the best minds in the React ecosystem. Explore the latest in React 19, Server Components, concurrent features, and much more.

This year's summit features over 40 speakers from companies like Meta, Vercel, and the open-source community. Whether you're a beginner or a senior engineer, you'll leave with new skills, inspiration, and connections that will shape your career.`,
  venueName: "Moscone Convention Center",
  venueCity: "San Francisco",
  venueAddress: "747 Howard St, San Francisco, CA 94103",
  startDate: new Date(Date.now() + 86400000 * 4).toISOString(),
  endDate: new Date(Date.now() + 86400000 * 6).toISOString(),
  imageUrl: null,
  organizer: "GitNation",
  attendeeCount: 1847,
  maxAttendees: 2000,
  tickets: [
    {
      id: "t1",
      name: "General Admission",
      priceCents: 19900,
      totalPriceCents: 19900,
      description: "Access to all talks and networking sessions",
      available: 153,
      total: 500,
    },
    {
      id: "t2",
      name: "Workshop Pass",
      priceCents: 34900,
      totalPriceCents: 34900,
      description: "All talks + 2 hands-on workshops of your choice",
      available: 28,
      total: 100,
    },
    {
      id: "t3",
      name: "VIP Experience",
      priceCents: 69900,
      totalPriceCents: 69900,
      description: "Full access + speaker dinner + priority seating",
      available: 7,
      total: 30,
    },
  ],
};
