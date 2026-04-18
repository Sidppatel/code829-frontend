import type { ReactNode } from 'react';
import { Descriptions, Modal } from 'antd';
import type { DescriptionsItemType } from 'antd/es/descriptions';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  tone?: string;
  descriptions?: DescriptionsItemType[];
  width?: number;
  children?: ReactNode;
}

export default function DetailModal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  tone = 'var(--primary)',
  descriptions,
  width = 720,
  children,
}: Props) {
  const hasDescriptions = !!descriptions && descriptions.length > 0;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={width}
      destroyOnHidden
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {icon && (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: tone,
                color: 'var(--text-on-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>
            )}
          </div>
        </div>
      }
    >
      {hasDescriptions && (
        <Descriptions bordered column={1} size="small" items={descriptions} style={{ marginTop: 8 }} />
      )}
      {children && <div style={{ marginTop: hasDescriptions ? 16 : 8 }}>{children}</div>}
    </Modal>
  );
}
