export const centsToUSD = (cents: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

/**
 * Form-boundary conversion: turn stored cents into the number a dollar-denominated
 * InputNumber control expects. Inverse of `dollarsToCents` (which is the allowed
 * form-input escape hatch — `Math.round(dollars * 100)`).
 *
 * Kept in a `.ts` file (not .tsx) so the arithmetic is out of JSX and the
 * no-business-calc-in-jsx lint rule doesn't fire at every call site.
 */
export const centsToDollars = (cents: number): number => cents / 100;

/** Form-boundary conversion: dollars (user input) to integer cents for the API. */
export const dollarsToCents = (dollars: number): number => Math.round(dollars * 100);
