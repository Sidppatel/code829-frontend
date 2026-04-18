import { useCallback } from 'react';
import { Button, Input, Tag, Typography } from 'antd';
import { DeleteOutlined, SendOutlined } from '@ant-design/icons';
import apiClient from '@code829/shared/lib/axios';
import {
  CrudModal,
  DataTableSection,
  FormField,
  PageShell,
} from '@code829/shared/components/ui';
import {
  useAsyncAction,
  useAsyncResource,
  useConfirm,
  useCrudModal,
} from '@code829/shared/hooks';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  invitedByName: string;
  expiresAt: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  Pending: 'blue',
  Accepted: 'green',
  Revoked: 'default',
  Expired: 'orange',
};

export default function InvitationsPage() {
  const fetchInvitations = useCallback(async () => {
    const { data } = await apiClient.get<{ items: Invitation[] }>('/admin/staff/invitations');
    return data.items;
  }, []);
  const { data: invitations, loading, refresh } = useAsyncResource(fetchInvitations);

  const crud = useCrudModal<Invitation>();
  const send = useAsyncAction(
    (values: { email: string }) =>
      apiClient.post('/admin/staff/invite', { email: values.email, role: 'Staff' }),
    { successMessage: 'Invitation sent', onSuccess: () => { crud.close(); refresh(); } },
  );
  const revoke = useAsyncAction(
    (id: string) => apiClient.delete(`/admin/staff/invitations/${id}`),
    { successMessage: 'Invitation revoked', onSuccess: refresh },
  );
  const confirm = useConfirm();

  const items = invitations ?? [];

  return (
    <PageShell
      title="Invitations"
      subtitle="Manage staff invitations"
      extra={
        <Button type="primary" icon={<SendOutlined />} onClick={crud.openCreate}>
          Send Invitation
        </Button>
      }
    >
      <DataTableSection<Invitation>
        data={items}
        total={items.length}
        page={1}
        pageSize={items.length || 10}
        loading={loading}
        onPageChange={() => {}}
        rowKey="id"
        showSizeChanger={false}
        columns={[
          { title: 'Email', dataIndex: 'email', key: 'email' },
          { title: 'Role', dataIndex: 'role', key: 'role', render: (r: string) => <Tag>{r}</Tag> },
          { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s}</Tag> },
          { title: 'Invited By', dataIndex: 'invitedByName', key: 'invitedByName' },
          { title: 'Expires', dataIndex: 'expiresAt', key: 'expiresAt', render: (d: string) => new Date(d).toLocaleDateString() },
          {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, r: Invitation) =>
              r.status === 'Pending' ? (
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  size="small"
                  onClick={() =>
                    confirm({
                      title: 'Revoke invitation?',
                      description: `This will revoke the invitation for ${r.email}.`,
                      tone: 'danger',
                      confirmLabel: 'Revoke',
                      onConfirm: () => revoke.run(r.id),
                    })
                  }
                >
                  Revoke
                </Button>
              ) : (
                <Typography.Text type="secondary">—</Typography.Text>
              ),
          },
        ]}
        empty={{
          title: 'No invitations yet',
          description: 'Invite your first staff member to get started.',
          actionLabel: 'Send Invitation',
          onAction: crud.openCreate,
        }}
      />
      <CrudModal<{ email: string }>
        open={crud.open}
        mode={crud.mode}
        onClose={crud.close}
        saving={send.loading}
        onSubmit={async (v) => { await send.run(v); }}
        titles={{ create: 'Invite Staff Member', edit: 'Edit Invitation' }}
        submitLabel={{ create: 'Send Invitation' }}
      >
        {() => (
          <FormField
            name="email"
            label="Email"
            required
            rules={[{ type: 'email', message: 'Enter a valid email' }]}
          >
            <Input placeholder="staff@example.com" />
          </FormField>
        )}
      </CrudModal>
    </PageShell>
  );
}
