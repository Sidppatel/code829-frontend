import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, Typography, Card, Tag, App, Space } from 'antd';
import { SendOutlined, DeleteOutlined } from '@ant-design/icons';
import apiClient from '@code829/shared/lib/axios';
import PageHeader from '@code829/shared/components/shared/PageHeader';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  invitedByName: string;
  expiresAt: string;
  createdAt: string;
}

export default function DevInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/developer/invitations');
      setInvitations(data.items);
    } catch { message.error('Failed to load invitations'); }
    finally { setLoading(false); }
  }, [message]);

  useEffect(() => { void fetchInvitations(); }, [fetchInvitations]);

  const sendInvitation = async (values: { email: string; role: string }) => {
    setSending(true);
    try {
      await apiClient.post('/developer/invitations', values);
      message.success('Invitation sent!');
      form.resetFields();
      setModalOpen(false);
      void fetchInvitations();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send invitation';
      message.error(msg);
    } finally { setSending(false); }
  };

  const revokeInvitation = async (id: string) => {
    try {
      await apiClient.delete(`/developer/invitations/${id}`);
      message.success('Invitation revoked');
      void fetchInvitations();
    } catch { message.error('Failed to revoke invitation'); }
  };

  const STATUS_COLORS: Record<string, string> = { Pending: 'blue', Accepted: 'green', Revoked: 'default', Expired: 'orange' };
  const ROLE_COLORS: Record<string, string> = { Admin: 'purple', Staff: 'blue' };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Invitations" subtitle="Manage all platform invitations" />
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<SendOutlined />} onClick={() => setModalOpen(true)}>Send Invitation</Button>
        </Space>
        <Table dataSource={invitations} rowKey="id" loading={loading}
          columns={[
            { title: 'Email', dataIndex: 'email' },
            { title: 'Role', dataIndex: 'role', render: (r: string) => <Tag color={ROLE_COLORS[r]}>{r}</Tag> },
            { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s}</Tag> },
            { title: 'Invited By', dataIndex: 'invitedByName' },
            { title: 'Expires', dataIndex: 'expiresAt', render: (d: string) => new Date(d).toLocaleDateString() },
            { title: 'Actions', render: (_: unknown, r: Invitation) => r.status === 'Pending' ? <Button icon={<DeleteOutlined />} danger size="small" onClick={() => revokeInvitation(r.id)}>Revoke</Button> : <Typography.Text type="secondary">—</Typography.Text> },
          ]}
        />
      </Card>
      <Modal title="Send Invitation" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={sendInvitation} initialValues={{ role: 'Staff' }}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={[{ value: 'Admin', label: 'Admin' }, { value: 'Staff', label: 'Staff' }]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={sending} block>Send Invitation</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
