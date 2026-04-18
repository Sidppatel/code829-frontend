import type { EventTableTypeInfo } from '../../types/event';
import { centsToUSD } from '../../utils/currency';

interface Props {
  tiers: EventTableTypeInfo[];
  compact?: boolean;
}

export default function TierLegend({ tiers, compact = false }: Props) {
  if (!tiers.length) return null;
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: compact ? 10 : 14,
        fontSize: 12,
        color: 'var(--text-secondary)',
      }}
    >
      {tiers.map((tier) => (
        <span
          key={tier.id}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: tier.color ?? 'var(--primary)',
              border: '1px solid var(--border)',
            }}
          />
          {tier.label} · {tier.capacity}p · {centsToUSD(tier.displayPriceCents)}
        </span>
      ))}
    </div>
  );
}
