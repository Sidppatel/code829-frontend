import { Typography, theme } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useHoldTimer } from '../../hooks/useHoldTimer';

interface Props {
  expiresAt: string;
  onExpired?: () => void;
}

export default function TableLockTimer({ expiresAt, onExpired }: Props) {
  const secondsLeft = useHoldTimer(expiresAt);
  const { token } = theme.useToken();

  if (secondsLeft <= 0) {
    if (onExpired) onExpired();
    return (
      <Typography.Text type="danger">
        <ClockCircleOutlined /> Reservation expired
      </Typography.Text>
    );
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft <= 60;

  return (
    <Typography.Text style={{ color: isUrgent ? token.colorError : token.colorWarning }}>
      <ClockCircleOutlined /> Table reserved for {minutes}:{seconds.toString().padStart(2, '0')}
    </Typography.Text>
  );
}
