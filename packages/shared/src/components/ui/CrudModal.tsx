import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Form, Modal } from 'antd';
import type { FormInstance } from 'antd';

interface Props<V> {
  open: boolean;
  mode: 'create' | 'edit';
  titles: { create: string; edit: string };
  initialValues?: Partial<V>;
  onSubmit: (values: V) => Promise<void> | void;
  onClose: () => void;
  saving?: boolean;
  width?: number;
  children: (form: FormInstance<V>) => ReactNode;
  submitLabel?: { create?: string; edit?: string };
  cancelLabel?: string;
}

export default function CrudModal<V extends object = Record<string, unknown>>({
  open,
  mode,
  titles,
  initialValues,
  onSubmit,
  onClose,
  saving,
  width = 560,
  children,
  submitLabel,
  cancelLabel = 'Cancel',
}: Props<V>) {
  const [form] = Form.useForm<V>();

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (initialValues) form.setFieldsValue(initialValues as V);
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
  };

  const okText = mode === 'edit' ? (submitLabel?.edit ?? 'Save') : (submitLabel?.create ?? 'Create');

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      title={mode === 'edit' ? titles.edit : titles.create}
      width={width}
      confirmLoading={saving}
      okText={okText}
      cancelText={cancelLabel}
      centered
      destroyOnHidden
      mask={{ closable: false }}
    >
      <Form<V> form={form} layout="vertical" preserve={false} initialValues={initialValues as V}>
        {children(form)}
      </Form>
    </Modal>
  );
}
