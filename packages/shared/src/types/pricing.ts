export interface PricingQuote {
  subtotalCents: number;
  feeCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  formattedTotal: string;
  expiresAt: string;
}

export interface PricingQuoteRequest {
  eventId: string;
  tableIds?: string[];
  seatCount?: number;
  eventTicketTypeId?: string;
}
