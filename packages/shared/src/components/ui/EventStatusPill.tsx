import StatusBadge, { type StatusKind } from './StatusBadge';

const STATUS_MAP: Record<string, { kind: StatusKind; label: string }> = {
  Draft: { kind: 'draft', label: 'Draft' },
  Published: { kind: 'published', label: 'Published' },
  Live: { kind: 'live', label: 'Live' },
  SoldOut: { kind: 'soldout', label: 'Sold Out' },
  Cancelled: { kind: 'cancelled', label: 'Cancelled' },
  Completed: { kind: 'completed', label: 'Completed' },
};

interface Props {
  status: string;
}

export default function EventStatusPill({ status }: Props) {
  const meta = STATUS_MAP[status] ?? { kind: 'neutral' as const, label: status };
  return <StatusBadge kind={meta.kind}>{meta.label}</StatusBadge>;
}
