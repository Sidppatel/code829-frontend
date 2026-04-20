import { Tag, Typography } from 'antd';
import type { AxiosResponse } from 'axios';
import apiClient from '@code829/shared/lib/axios';
import { usePagedTable } from '@code829/shared/hooks/usePagedTable';
import {
  DataTableSection,
  FilterBar,
  PageShell,
} from '@code829/shared/components/ui';
import type { PagedResponse } from '@code829/shared/types/shared';

interface AdminUser {
  adminUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
}

interface AdminListParams extends Record<string, unknown> {
  search?: string;
}

export default function AdminsPage() {
  const paged = usePagedTable<AdminUser, AdminListParams>({
    fetcher: (params) =>
      apiClient.get<PagedResponse<AdminUser>>('/admin/admins', { params }) as Promise<AxiosResponse<PagedResponse<AdminUser>>>,
    defaultPageSize: 25,
  });

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
      <DataTableSection<AdminUser>
        data={paged.data}
        total={paged.total}
        page={paged.page}
        pageSize={paged.pageSize}
        loading={paged.loading}
        onPageChange={paged.onPageChange}
        rowKey="adminUserId"
        columns={[
          { title: 'Name', key: 'name', render: (_: unknown, r: AdminUser) => `${r.firstName} ${r.lastName}` },
          { title: 'Email', dataIndex: 'email', key: 'email' },
          {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (r: string) => <Tag color="purple">{r}</Tag>,
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
