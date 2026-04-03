export interface LayoutTable {
  id: string;
  label: string;
  capacity: number;
  shape: string;
  color?: string;
  priceCents: number;
  isActive: boolean;
  posX: number;
  posY: number;
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
  priceCents: number;
  expiresAt: string;
}

export interface TableStatusInfo {
  id: string;
  label: string;
  capacity: number;
  shape: string;
  color?: string;
  posX: number;
  posY: number;
  status: 'Available' | 'Held' | 'Booked';
  seatsSold: number;
  bookingCount: number;
  bookers: string[];
}
