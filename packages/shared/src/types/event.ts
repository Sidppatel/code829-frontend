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
  layoutMode: string;
  pricePerPersonCents?: number;
  totalCapacity: number;
  totalSold: number;
  noOfAvailableTables: number;
  minPricePerTableCents?: number;
  venue?: VenueBasic;
  ticketTypes?: EventTicketType[];
}

export interface EventDetail extends EventSummary {
  description?: string;
  maxCapacity?: number;
  platformFeePercent?: number;
  platformFeeCents?: number;
  publishedAt?: string;
  venueId: string;
  venue: VenueBasic;
  organizerId?: string;
  organizerName?: string;
  pricingTiers?: EventPricingTier[];
  pricePerPersonCents?: number;
  gridRows?: number;
  gridCols?: number;
  soldCount?: number;
  checkInCount?: number;
  createdAt: string;
  minPricePerTableCents?: number;
  ticketTypes?: EventTicketType[];
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

export interface EventFacets {
  categories: string[];
  cities: string[];
  venues: { venueId: string; name: string }[];
  priceRange: { min: number; max: number };
}

export interface EventTicketType {
  id?: string;
  name: string;
  priceCents: number;
  capacity?: number;
  description?: string;
  soldCount?: number;
}

export interface EventPricingTier {
  id?: string;
  name: string;
  priceCents: number;
  capacity?: number;
  count: number;
  soldCount: number;
  totalCapacity?: number;
}

export interface EventTableTypeInfo {
  id: string;
  label: string;
  capacity: number;
  shape: string;
  color?: string;
  priceCents: number;
}

export interface EventTableDto {
  id: string;
  label: string;
  capacity: number;
  shape: string;
  color?: string;
  priceCents: number;
  gridRow: number;
  gridCol: number;
  sortOrder?: number;
  status: 'Available' | 'Held' | 'HeldByYou' | 'Booked';
  holdExpiresAt?: string;
  isLockedByYou: boolean;
  eventTableId: string;
  eventTableLabel?: string;
}

export interface EventTablesResponse {
  eventId: string;
  gridRows?: number;
  gridCols?: number;
  eventTableTypes: EventTableTypeInfo[];
  tables: EventTableDto[];
}
