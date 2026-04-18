export function computeProjectedRevenueCents(
  rows: Array<{ priceCents: number; capacity: number | null }>
): number {
  let total = 0;
  for (const r of rows) {
    if (r.capacity != null) total += r.priceCents * r.capacity;
  }
  return total;
}
