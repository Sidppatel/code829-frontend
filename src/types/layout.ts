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
