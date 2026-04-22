export function computeProjectedRevenueCents(
  rows: Array<{ priceCents?: number; capacity: number | null }>
): number {
  let total = 0;
  for (const r of rows) {
    if (r.capacity != null) total += (r.priceCents ?? 0) * r.capacity;
  }
  return total;
}
