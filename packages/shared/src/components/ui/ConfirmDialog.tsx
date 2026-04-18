import type { ReactNode } from 'react';
import { Modal } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

export type ConfirmTone = 'primary' | 'danger' | 'warning';

export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => unknown | Promise<unknown>;
}

interface Props extends ConfirmOptions {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
}

const TONE_COLOR: Record<ConfirmTone, string> = {
  primary: 'var(--primary)',
  danger: 'var(--status-danger)',
  warning: 'var(--status-warning)',
};

export default function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  onConfirm,
  loading,
}: Props) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={async () => {
        await onConfirm();
      }}
      okText={confirmLabel ?? (tone === 'danger' ? 'Delete' : 'Confirm')}
      cancelText={cancelLabel}
      okButtonProps={{ danger: tone === 'danger', loading }}
      centered
      destroyOnHidden
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ExclamationCircleFilled style={{ fontSize: 20, color: TONE_COLOR[tone] }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
        </div>
      }
    >
      {description && (
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: 4 }}>
          {description}
        </div>
      )}
    </Modal>
  );
}
