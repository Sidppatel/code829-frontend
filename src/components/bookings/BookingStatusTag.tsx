import { Tag } from 'antd';
import type { BookingStatus } from '../../types/booking';

const STATUS_COLORS: Record<BookingStatus, string> = {
  Pending: 'orange',
  Paid: 'green',
  CheckedIn: 'blue',
  Cancelled: 'default',
  Refunded: 'red',
};

interface Props {
  status: BookingStatus;
}

export default function BookingStatusTag({ status }: Props) {
  return <Tag color={STATUS_COLORS[status]}>{status}</Tag>;
}
