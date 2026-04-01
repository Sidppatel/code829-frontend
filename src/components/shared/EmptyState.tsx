import { Empty, Button } from 'antd';

interface Props {
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ description = 'No data', actionLabel, onAction }: Props) {
  return (
    <Empty description={description}>
      {actionLabel && onAction && (
        <Button type="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Empty>
  );
}
