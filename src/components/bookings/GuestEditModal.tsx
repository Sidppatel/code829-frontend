import { Modal, Form, Input, Switch, App } from 'antd';
import { useState } from 'react';
import { bookingsApi } from '../../services/api';

interface Props {
  open: boolean;
  bookingId: string;
  itemId: string;
  initialName?: string;
  initialEmail?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function GuestEditModal({
  open,
  bookingId,
  itemId,
  initialName,
  initialEmail,
  onClose,
  onSaved,
}: Props) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await bookingsApi.updateGuest(bookingId, itemId, {
        guestName: values.guestName || null,
        guestEmail: values.guestEmail || null,
        sendInvitation: values.sendInvitation ?? false,
      });
      message.success('Guest updated');
      onSaved();
      onClose();
    } catch {
      message.error('Failed to update guest');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Edit Guest"
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={saving}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          guestName: initialName ?? '',
          guestEmail: initialEmail ?? '',
          sendInvitation: false,
        }}
      >
        <Form.Item name="guestName" label="Guest Name">
          <Input placeholder="Guest name" />
        </Form.Item>
        <Form.Item name="guestEmail" label="Guest Email" rules={[{ type: 'email', message: 'Invalid email' }]}>
          <Input placeholder="guest@example.com" />
        </Form.Item>
        <Form.Item name="sendInvitation" label="Send Invitation" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
