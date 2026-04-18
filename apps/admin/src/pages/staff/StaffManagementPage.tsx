import { Button, Switch, Tag, Typography } from 'antd';
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

interface StaffUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface StaffListParams extends Record<string, unknown> {
  search?: string;
}

export default function StaffManagementPage() {
  const navigate = useNavigate();

  const paged = usePagedTable<StaffUser, StaffListParams>({
    fetcher: (params) =>
      apiClient.get<PagedResponse<StaffUser>>('/admin/staff', { params }) as Promise<AxiosResponse<PagedResponse<StaffUser>>>,
    defaultPageSize: 25,
  });

  const toggle = useAsyncAction(
    (id: string, isActive: boolean) => apiClient.put(`/admin/staff/${id}`, { isActive }),
    {
      successMessage: 'Account updated',
      onSuccess: paged.refresh,
    },
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
      <DataTableSection<StaffUser>
        data={paged.data}
        total={paged.total}
        page={paged.page}
        pageSize={paged.pageSize}
        loading={paged.loading}
        onPageChange={paged.onPageChange}
        rowKey="id"
        columns={[
          { title: 'Name', key: 'name', render: (_: unknown, r: StaffUser) => `${r.firstName} ${r.lastName}` },
          { title: 'Email', dataIndex: 'email', key: 'email' },
          {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (r: string) => <Tag color={r === 'Admin' ? 'purple' : 'blue'}>{r}</Tag>,
          },
          {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (active: boolean, r: StaffUser) => (
              <Switch
                checked={active}
                onChange={(v) => { void toggle.run(r.id, v); }}
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
