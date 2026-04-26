// Mirrors backend PublicQuoteDto (POST /purchases/quote).
// Single rolled-in display number — no subtotal/fee/tax breakdown.
export interface PublicQuote {
  displayTotalCents: number;
  seatsIncluded: number;
  currency: string;
  formattedDisplayTotal: string;
  expiresAt: string;
}

// Mirrors backend CheckoutQuoteDto (POST /purchases/checkout-quote).
// Display total + tax + grand total. Used only on the checkout step.
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
