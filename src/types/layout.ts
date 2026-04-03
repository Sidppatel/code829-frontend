export interface SeatHold {
  id: string;
  seatId: string;
  eventId: string;
  userId: string;
  expiresAt: string;
  isActive: boolean;
}

export interface LayoutTable {
  id: string;
  label: string;
  capacity: number;
  shape: string;
  color?: string;
  section?: string;
  priceType: string;
  priceCents: number;
  priceOverrideCents?: number;
  platformFeeCents: number;
  isActive: boolean;
  gridRow?: number;
  gridCol?: number;
  sortOrder?: number;
  tableTypeId?: string;
  tableTypeName?: string;
}

export interface TableType {
  id: string;
  name: string;
  defaultCapacity: number;
  defaultShape: string;
  defaultColor?: string;
  defaultPriceCents?: number;
  platformFeeCents: number;
  isActive: boolean;
}

export interface LayoutStatsResponse {
  totalTables: number;
  totalCapacity: number;
  totalPotentialRevenueCents: number;
  totalBookedRevenueCents: number;
}

export interface TableLock {
  tableId: string;
  tableLabel: string;
  eventId: string;
  userId: string;
  status: string;
  capacity: number;
  priceType: string;
  priceCents: number;
  platformFeeCents: number;
  expiresAt: string;
}

export interface TableStatusInfo {
  id: string;
  label: string;
  capacity: number;
  shape: string;
  color?: string;
  gridRow?: number;
  gridCol?: number;
  status: 'Available' | 'Held' | 'Booked';
  seatsSold: number;
  bookingCount: number;
  bookers: string[];
}
