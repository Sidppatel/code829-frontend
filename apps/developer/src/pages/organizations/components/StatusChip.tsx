import { Tag } from 'antd';
import type { OrganizationStripeState } from '@code829/shared/types/organizations';

const STATE_META: Record<
  OrganizationStripeState,
  { color: string; label: string }
> = {
  not_started: { color: 'default', label: 'Not Started' },
  identity_pending: { color: 'orange', label: 'Identity Pending' },
  needs_bank: { color: 'gold', label: 'Needs Bank' },
  active: { color: 'green', label: 'Active' },
  rejected: { color: 'red', label: 'Rejected' },
};

interface Props {
  state: OrganizationStripeState;
}

export default function StatusChip({ state }: Props) {
  const meta = STATE_META[state] ?? STATE_META.not_started;
  return <Tag color={meta.color}>{meta.label}</Tag>;
}
