import { Tag } from 'antd';
import type { PurchaseStatus } from '@code829/shared/types/purchase';

const STATUS_COLORS: Record<PurchaseStatus, string> = {
  Pending: 'orange',
  Paid: 'green',
  CheckedIn: 'blue',
  Cancelled: 'default',
  Refunded: 'red',
  Expired: 'default',
};

interface Props {
  status: PurchaseStatus;
}

export default function PurchaseStatusTag({ status }: Props) {
  return <Tag color={STATUS_COLORS[status]}>{status}</Tag>;
}
