import { useCallback } from 'react';
import { createElement } from 'react';
import { App } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import type { ConfirmOptions, ConfirmTone } from '../components/ui/ConfirmDialog';

const TONE_COLOR: Record<ConfirmTone, string> = {
  primary: 'var(--primary)',
  danger: 'var(--status-danger)',
  warning: 'var(--status-warning)',
};

export function useConfirm() {
  const { modal } = App.useApp();

  return useCallback(
    (opts: ConfirmOptions): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        modal.confirm({
          title: opts.title,
          content: opts.description,
          icon: createElement(ExclamationCircleFilled, {
            style: { color: TONE_COLOR[opts.tone ?? 'primary'] },
          }),
          okText: opts.confirmLabel ?? (opts.tone === 'danger' ? 'Delete' : 'Confirm'),
          cancelText: opts.cancelLabel ?? 'Cancel',
          okButtonProps: { danger: opts.tone === 'danger' },
          centered: true,
          onOk: async () => {
            try {
              await opts.onConfirm();
              resolve(true);
            } catch (err) {
              resolve(false);
              throw err;
            }
          },
          onCancel: () => resolve(false),
        });
      }),
    [modal],
  );
}
