export interface EventSummary {
  eventId: string;
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
  totalCapacity: number;
  totalSold: number;
  noOfAvailableTables: number;
  displayFromAmountCents?: number;
  displayFromFormatted?: string;
  isSoldOut: boolean;
  availableCount: number;
  venue?: VenueBasic;
  ticketTypes?: EventTicketType[];
  totalTables?: number;
  bookedTables?: number;
}

export interface EventDetail extends EventSummary {
  description?: string;
  maxCapacity?: number;
  publishedAt?: string;
  venueId: string;
  venue: VenueBasic;
  adminUserId?: string;
  organizerName?: string;
  gridRows?: number;
  gridCols?: number;
  soldCount?: number;
  checkInCount?: number;
  createdAt: string;
  ticketTypes?: EventTicketType[];
  tableTypes?: EventTableTypeSummary[];
  /** Raw per-person price (pre-fee) — admin surfaces only. Public pages use displayFromAmountCents. */
  pricePerPersonCents?: number;
}

export interface VenueBasic {
  venueId: string;
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
  id: string;
  label: string;
  priceCents: number;
  displayPriceCents: number;
  maxQuantity?: number;
  sortOrder: number;
  isActive: boolean;
  soldCount: number;
  availableCount: number;
  isSoldOut: boolean;
  description?: string;
}

export interface EventTicketTypesResponse {
  eventId: string;
  ticketTypes: EventTicketType[];
}


export interface EventTableTypeSummary {
  id: string;
  label: string;
  capacity: number;
  shape: string;
  color?: string;
  priceCents: number;
  platformFeeCents?: number;
  displayPriceCents: number;
  totalTables: number;
  availableTables: number;
  bookedTables: number;
}

export interface EventTableTypeInfo {
  id: string;
  label: string;
  capacity: number;
  shape: string;
  color?: string;
  priceCents: number;
  displayPriceCents: number;
}

export interface EventTableDto {
  id: string;
  label: string;
  capacity: number;
  shape: string;
  color?: string;
  priceCents: number;
  displayPriceCents: number;
  gridRow: number;
  gridCol: number;
  sortOrder?: number;
  status: 'Available' | 'Held' | 'HeldByYou' | 'Booked';
  holdExpiresAt?: string;
  isAvailable: boolean;
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
