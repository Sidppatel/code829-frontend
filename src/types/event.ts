export interface EventSummary {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  isFeatured: boolean;
  venueName: string;
  venueCity: string;
  venueState: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  quantityTotal: number;
  quantitySold: number;
}

export interface EventDetail extends EventSummary {
  description?: string;
  layoutMode: string;
  maxCapacity?: number;
  platformFeePercent?: number;
  publishedAt?: string;
  venueId: string;
  venue: VenueBasic;
  organizerId?: string;
  organizerName?: string;
  ticketTypes: TicketType[];
  createdAt: string;
}

export interface VenueBasic {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  description?: string;
  imageUrl?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TicketType {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  quantityTotal: number;
  quantitySold: number;
  quantityAvailable: number;
  sortOrder: number;
  platformFeeCents: number;
}

export interface EventFacets {
  categories: string[];
  cities: string[];
  venues: { venueId: string; name: string }[];
  priceRange: { min: number; max: number };
}

export interface EventTableDto {
  id: string;
  label: string;
  capacity: number;
  shape: string;
  color?: string;
  section?: string;
  priceType: string;
  priceCents: number;
  platformFeeCents: number;
  gridRow?: number;
  gridCol?: number;
  sortOrder?: number;
  status: 'Available' | 'Held' | 'HeldByYou' | 'Booked';
  expiresAt?: string;
}

export interface EventTablesResponse {
  eventId: string;
  gridRows: number;
  gridCols: number;
  tables: EventTableDto[];
}
