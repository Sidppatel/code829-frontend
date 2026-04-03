export interface LayoutTable {
  id: string;
  label: string;
  gridRow: number;
  gridCol: number;
  isActive: boolean;
  sortOrder: number;
  eventTableId: string;
  eventTableLabel?: string;
  // Joined from EventTable (read-only in UI)
  capacity: number;
  shape: string;
  color?: string;
  priceCents: number;
  status?: 'Available' | 'Locked' | 'Booked';
}

export interface TableTemplate {
  id: string;
  name: string;
  defaultCapacity: number;
  defaultShape: string;
  defaultColor?: string;
  defaultPriceCents: number;
  isActive: boolean;
}

export interface EventTableType {
  id: string;
  label: string;
  capacity: number;
  shape: string;
  color?: string;
  priceCents: number;
  isActive: boolean;
  eventId: string;
  tableTemplateId?: string;
  tableTemplateName?: string;
  tableCount?: number;
  /** True when not yet persisted to the DB — created on first table placement */
  isPending?: boolean;
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
  gridRow: number;
  gridCol: number;
  capacity: number;
  shape: string;
  color?: string;
  status: 'Available' | 'Held' | 'Booked';
  seatsSold: number;
  bookingCount: number;
  bookers: string[];
}
