import { useCallback } from 'react';
import { Button, Input, Select, Tag, Typography } from 'antd';
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

interface InvitationForm {
  email: string;
  role: string;
}

const STATUS_COLORS: Record<string, string> = {
  Pending: 'blue',
  Accepted: 'green',
  Revoked: 'default',
  Expired: 'orange',
};

const ROLE_COLORS: Record<string, string> = {
  Admin: 'purple',
  Staff: 'blue',
};

export default function DevInvitationsPage() {
  const fetchInvitations = useCallback(async () => {
    const { data } = await apiClient.get<{ items: Invitation[] }>('/developer/invitations');
    return data.items;
  }, []);
  const { data: invitations, loading, refresh } = useAsyncResource(fetchInvitations);

  const crud = useCrudModal<Invitation>();
  const send = useAsyncAction(
    (values: InvitationForm) => apiClient.post('/developer/invitations', values),
    { successMessage: 'Invitation sent', onSuccess: () => { crud.close(); refresh(); } },
  );
  const revoke = useAsyncAction(
    (id: string) => apiClient.delete(`/developer/invitations/${id}`),
    { successMessage: 'Invitation revoked', onSuccess: refresh },
  );
  const confirm = useConfirm();

  const items = invitations ?? [];

  return (
    <PageShell
      title="Invitations"
      subtitle="Manage all platform invitations"
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
          {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (r: string) => <Tag color={ROLE_COLORS[r]}>{r}</Tag>,
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s}</Tag>,
          },
          { title: 'Invited By', dataIndex: 'invitedByName', key: 'invitedByName' },
          {
            title: 'Expires',
            dataIndex: 'expiresAt',
            key: 'expiresAt',
            render: (d: string) => new Date(d).toLocaleDateString(),
          },
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
                      description: `Revoke invitation for ${r.email}?`,
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
          description: 'Send your first invitation to get started.',
          actionLabel: 'Send Invitation',
          onAction: crud.openCreate,
        }}
      />
      <CrudModal<InvitationForm>
        open={crud.open}
        mode={crud.mode}
        onClose={crud.close}
        saving={send.loading}
        initialValues={{ role: 'Staff' }}
        onSubmit={async (v) => { await send.run(v); }}
        titles={{ create: 'Send Invitation', edit: 'Edit Invitation' }}
        submitLabel={{ create: 'Send Invitation' }}
      >
        {() => (
          <>
            <FormField
              name="email"
              label="Email"
              required
              rules={[{ type: 'email', message: 'Enter a valid email' }]}
            >
              <Input placeholder="user@example.com" />
            </FormField>
            <FormField name="role" label="Role" required>
              <Select
                options={[
                  { value: 'Admin', label: 'Admin' },
                  { value: 'Staff', label: 'Staff' },
                ]}
              />
            </FormField>
          </>
        )}
      </CrudModal>
    </PageShell>
  );
}
