import { useEffect, useRef } from 'react';
import { Typography, theme } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useHoldTimer } from '@code829/shared/hooks/useHoldTimer';

interface Props {
  expiresAt: string;
  onExpired?: () => void;
}

export default function TableLockTimer({ expiresAt, onExpired }: Props) {
  const secondsLeft = useHoldTimer(expiresAt);
  const { token } = theme.useToken();
  const expiredRef = useRef(false);

  useEffect(() => {
    if (secondsLeft <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpired?.();
    }
  }, [secondsLeft, onExpired]);

  if (secondsLeft <= 0) {
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
