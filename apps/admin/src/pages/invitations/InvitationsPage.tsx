import { useCallback, useState, useMemo } from 'react';
import { Button, Input, Select, Tag, Typography } from 'antd';
import { DeleteOutlined, SendOutlined, SearchOutlined } from '@ant-design/icons';
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
  useAuth,
  useConfirm,
  useCrudModal,
} from '@code829/shared/hooks';
import type { Invitation } from '@code829/shared/types/auth';

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

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { user } = useAuth();
  const isDeveloper = user?.role === 'Developer';

  const filteredItems = useMemo(() => {
    return (invitations ?? []).filter((item) => {
      const matchesSearch = !search ||
        item.email.toLowerCase().includes(search.toLowerCase()) ||
        item.invitedByName.toLowerCase().includes(search.toLowerCase());
      const matchesRole = !roleFilter || item.role === roleFilter;
      const matchesStatus = !statusFilter || item.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [invitations, search, roleFilter, statusFilter]);

  const crud = useCrudModal<Invitation>();
  const send = useAsyncAction(
    (values: { email: string; role: string }) =>
      apiClient.post('/admin/staff/invite', { email: values.email, role: values.role }),
    { successMessage: 'Invitation sent', onSuccess: () => { crud.close(); refresh(); } },
  );
  const revoke = useAsyncAction(
    (id: string) => apiClient.delete(`/admin/staff/invitations/${id}`),
    { successMessage: 'Invitation revoked', onSuccess: refresh },
  );
  const confirm = useConfirm();

  return (
    <PageShell
      title="Invitations"
      subtitle="Invite admins and staff members"
      extra={
        <Button type="primary" icon={<SendOutlined />} onClick={crud.openCreate}>
          Send Invitation
        </Button>
      }
    >
      <DataTableSection<Invitation>
        data={filteredItems}
        total={filteredItems.length}
        page={1}
        pageSize={filteredItems.length || 10}
        loading={loading}
        onPageChange={() => { }}
        rowKey="invitationId"
        showSizeChanger={false}
        toolbar={
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <Input
              placeholder="Search email or inviter..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Select
              placeholder="All Roles"
              style={{ width: 150 }}
              value={roleFilter}
              onChange={setRoleFilter}
              allowClear
            >
              <Select.Option value="Admin">Admin</Select.Option>
              <Select.Option value="Staff">Staff</Select.Option>
              {isDeveloper && <Select.Option value="Developer">Developer</Select.Option>}
            </Select>
            <Select
              placeholder="All Statuses"
              style={{ width: 150 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
            >
              <Select.Option value="Pending">Pending</Select.Option>
              <Select.Option value="Accepted">Accepted</Select.Option>
              <Select.Option value="Revoked">Revoked</Select.Option>
              <Select.Option value="Expired">Expired</Select.Option>
            </Select>
          </div>
        }
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
                      onConfirm: () => revoke.run(r.invitationId),
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
      <CrudModal<{ email: string; role: string }>
        open={crud.open}
        mode={crud.mode}
        onClose={crud.close}
        saving={send.loading}
        onSubmit={async (v) => { await send.run(v); }}
        titles={{ create: 'Send Invitation', edit: 'Edit Invitation' }}
        submitLabel={{ create: 'Send Invitation' }}
        initialValues={{ role: 'Staff' }}
      >
        {() => (
          <>
            <FormField
              name="email"
              label="Email"
              required
              rules={[{ type: 'email', message: 'Enter a valid email' }]}
            >
              <Input placeholder="email@example.com" />
            </FormField>
            <FormField name="role" label="Role" required>
              <Select>
                <Select.Option value="Staff">Staff</Select.Option>
                <Select.Option value="Admin">Admin</Select.Option>
                {isDeveloper && <Select.Option value="Developer">Developer</Select.Option>}
              </Select>
            </FormField>
          </>
        )}
      </CrudModal>
    </PageShell>
  );
}
