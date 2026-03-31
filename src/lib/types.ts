/**
 * Shared TypeScript types matching the backend API contracts.
 * Used across pages and services to avoid duplicating interface definitions.
 */

export interface ApiEventItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  startDate: string;
  endDate: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  venueName: string;
  venueCity: string;
  venueState: string;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  totalCapacity: number | null;
  totalSold: number | null;
}

export interface ApiEventsResponse {
  items: ApiEventItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
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
