export interface PublicQuote {
  displayTotalCents: number;
  seatsIncluded: number;
  currency: string;
  formattedDisplayTotal: string;
  expiresAt: string;
}

export interface CheckoutQuote {
  displayTotalCents: number;
  taxCents: number;
  grandTotalCents: number;
  seatsIncluded: number;
  currency: string;
  formattedDisplayTotal: string;
  formattedTax: string;
  formattedGrandTotal: string;
  taxCalculationId: string | null;
  expiresAt: string;
}

export interface PricingQuoteRequest {
  eventId: string;
  tableIds?: string[];
  seatCount?: number;
  eventTicketTypeId?: string;
}
