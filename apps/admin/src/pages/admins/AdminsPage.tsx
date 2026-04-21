import { Select, Tag, Typography } from 'antd';
import type { AxiosResponse } from 'axios';
import apiClient from '@code829/shared/lib/axios';
import { usePagedTable } from '@code829/shared/hooks/usePagedTable';
import { useAsyncAction } from '@code829/shared/hooks';
import {
  DataTableSection,
  FilterBar,
  PageShell,
} from '@code829/shared/components/ui';
import type { PagedResponse } from '@code829/shared/types/shared';
import type { BusinessUserListItem } from '@code829/shared/types/auth';

interface AdminListParams extends Record<string, unknown> {
  search?: string;
}

export default function AdminsPage() {
  const paged = usePagedTable<BusinessUserListItem, AdminListParams>({
    fetcher: (params) =>
      apiClient.get<PagedResponse<BusinessUserListItem>>('/admin/admins', { params }) as Promise<AxiosResponse<PagedResponse<BusinessUserListItem>>>,
    defaultPageSize: 25,
  });

  const update = useAsyncAction(
    (id: string, role: string) =>
      apiClient.put(`/admin/staff/${id}`, { role }),
    { successMessage: 'Role updated', onSuccess: paged.refresh },
  );

  return (
    <PageShell
      title="Admins"
      subtitle="Active admin accounts"
    >
      <FilterBar
        search={{
          placeholder: 'Search admins...',
          value: paged.filters.search ?? '',
          onChange: (v) => paged.setFilters({ search: v }),
          width: 300,
        }}
      />
      <DataTableSection<BusinessUserListItem>
        data={paged.data}
        total={paged.total}
        page={paged.page}
        pageSize={paged.pageSize}
        loading={paged.loading}
        onPageChange={paged.onPageChange}
        rowKey="businessUserId"
        columns={[
          { title: 'Name', key: 'name', render: (_: unknown, r: BusinessUserListItem) => `${r.firstName} ${r.lastName}` },
          { title: 'Email', dataIndex: 'email', key: 'email' },
          {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (r: string, record: BusinessUserListItem) => (
              <Select
                value={r}
                size="small"
                style={{ width: 100 }}
                onChange={(v) => { void update.run(record.businessUserId, v); }}
                options={[
                  { value: 'Admin', label: <Tag color="purple">Admin</Tag> },
                  { value: 'Staff', label: <Tag color="blue">Staff</Tag> },
                ]}
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
        empty={{ title: 'No admins found', description: 'No active admin accounts match your search.' }}
      />
    </PageShell>
  );
}
