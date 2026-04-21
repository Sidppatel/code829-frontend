import { Button, Select, Switch, Tag, Typography } from 'antd';
import type { AxiosResponse } from 'axios';
import { UserAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '@code829/shared/lib/axios';
import { usePagedTable } from '@code829/shared/hooks/usePagedTable';
import { useAsyncAction } from '@code829/shared/hooks';
import {
  DataTableSection,
  FilterBar,
  PageShell,
} from '@code829/shared/components/ui';
import type { PagedResponse } from '@code829/shared/types/shared';
import type { AdminUserListItem } from '@code829/shared/types/auth';

interface StaffListParams extends Record<string, unknown> {
  search?: string;
}

export default function StaffManagementPage() {
  const navigate = useNavigate();

  const paged = usePagedTable<AdminUserListItem, StaffListParams>({
    fetcher: (params) =>
      apiClient.get<PagedResponse<AdminUserListItem>>('/admin/staff', { params }) as Promise<AxiosResponse<PagedResponse<AdminUserListItem>>>,
    defaultPageSize: 25,
  });

  const update = useAsyncAction(
    (id: string, payload: { isActive?: boolean; role?: string }) =>
      apiClient.put(`/admin/staff/${id}`, payload),
    { successMessage: 'Account updated', onSuccess: paged.refresh },
  );

  return (
    <PageShell
      title="Staff Management"
      subtitle="Manage staff accounts"
      extra={
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => navigate('/invitations')}>
          Invite Staff
        </Button>
      }
    >
      <FilterBar
        search={{
          placeholder: 'Search staff...',
          value: paged.filters.search ?? '',
          onChange: (v) => paged.setFilters({ search: v }),
          width: 300,
        }}
      />
      <DataTableSection<AdminUserListItem>
        data={paged.data}
        total={paged.total}
        page={paged.page}
        pageSize={paged.pageSize}
        loading={paged.loading}
        onPageChange={paged.onPageChange}
        rowKey="adminUserId"
        columns={[
          { title: 'Name', key: 'name', render: (_: unknown, r: AdminUserListItem) => `${r.firstName} ${r.lastName}` },
          { title: 'Email', dataIndex: 'email', key: 'email' },
          {
            title: 'Role',
            key: 'role',
            render: (_: unknown, r: AdminUserListItem) => (
              <Select
                value={r.role}
                size="small"
                style={{ width: 100 }}
                onChange={(v: string) => { void update.run(r.adminUserId, { role: v }); }}
                options={[
                  { value: 'Staff', label: <Tag color="blue">Staff</Tag> },
                  { value: 'Admin', label: <Tag color="purple">Admin</Tag> },
                ]}
              />
            ),
          },
          {
            title: 'Status',
            key: 'isActive',
            render: (_: unknown, r: AdminUserListItem) => (
              <Switch
                checked={r.isActive}
                onChange={(v) => { void update.run(r.adminUserId, { isActive: v }); }}
                checkedChildren="Active"
                unCheckedChildren="Disabled"
              />
            ),
          },
          {
            title: 'Last Login',
            dataIndex: 'lastLoginAt',
            key: 'lastLoginAt',
            render: (d?: string) =>
              d ? new Date(d).toLocaleDateString() : <Typography.Text type="secondary">Never</Typography.Text>,
          },
        ]}
        empty={{ title: 'No staff found', description: 'No staff accounts match your search.' }}
      />
    </PageShell>
  );
}
