import type { AxiosResponse } from 'axios';
import { Avatar, Button, Space, Switch, Tag, Tooltip, Typography } from 'antd';
import { DeleteOutlined, MailOutlined, PhoneOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons';
import { developerApi } from '../../services/api';
import { usePagedTable } from '@code829/shared/hooks/usePagedTable';
import { useAsyncAction, useConfirm } from '@code829/shared/hooks';
import { formatEventDate } from '@code829/shared/utils/date';
import type { DevUser } from '@code829/shared/services/developerApi';
import type { PagedResponse } from '@code829/shared/types/shared';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import {
  DataTableSection,
  FilterBar,
  PageShell,
} from '@code829/shared/components/ui';

interface DevUserListParams extends Record<string, unknown> {
  search?: string;
}

export default function DevUsersPage() {
  const paged = usePagedTable<DevUser, DevUserListParams>({
    fetcher: (params) => developerApi.getUsers(params) as Promise<AxiosResponse<PagedResponse<DevUser>>>,
    defaultPageSize: 25,
  });

  const toggleStatus = useAsyncAction(
    (id: string, isActive: boolean) => developerApi.updateUserStatus(id, isActive),
    {
      successMessage: 'Account updated',
      onSuccess: paged.refresh,
    },
  );

  const del = useAsyncAction(
    (id: string) => developerApi.deleteUser(id),
    { successMessage: 'User deleted', onSuccess: paged.refresh },
  );
  const confirm = useConfirm();

  return (
    <PageShell
      title="Customers"
      subtitle={`${paged.total.toLocaleString()} non-administrative accounts`}
    >
      <FilterBar
        search={{
          placeholder: 'Search by name or email...',
          onChange: (v) => paged.setFilters({ search: v }),
        }}
        actions={
          <Tag icon={<SafetyCertificateOutlined />} color="success" style={{ padding: '4px 12px', borderRadius: 20 }}>
            {paged.total} Total Customers
          </Tag>
        }
      />
      <DataTableSection<DevUser>
        data={paged.data}
        total={paged.total}
        page={paged.page}
        pageSize={paged.pageSize}
        loading={paged.loading}
        onPageChange={paged.onPageChange}
        rowKey="id"
        scrollX={800}
        size="large"
        columns={[
          {
            title: 'Customer',
            key: 'customer',
            render: (_: unknown, r: DevUser) => (
              <Space size="middle">
                <Avatar icon={<UserOutlined />} style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {r.firstName} {r.lastName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.email}</div>
                </div>
              </Space>
            ),
          },
          {
            title: 'Contact',
            key: 'contact',
            render: (_: unknown, r: DevUser) => (
              <Space direction="vertical" size={0}>
                <Typography.Text style={{ fontSize: 13 }}>
                  <MailOutlined style={{ marginRight: 8, opacity: 0.5 }} />
                  {r.email}
                </Typography.Text>
                {r.phone && (
                  <Typography.Text style={{ fontSize: 13 }}>
                    <PhoneOutlined style={{ marginRight: 8, opacity: 0.5 }} />
                    {r.phone}
                  </Typography.Text>
                )}
              </Space>
            ),
          },
          {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 120,
            render: (active: boolean, r: DevUser) => (
              <Tooltip title={active ? 'Active Customer' : 'Disabled Account'}>
                <Switch
                  checked={active}
                  loading={toggleStatus.loading}
                  onChange={(val) => { void toggleStatus.run(r.id, val); }}
                  size="small"
                />
              </Tooltip>
            ),
          },
          {
            title: 'Last Seen',
            dataIndex: 'lastLoginAt',
            key: 'lastLoginAt',
            width: 180,
            render: (d?: string) => (d ? formatEventDate(d) : <Tag>Never</Tag>),
          },
          {
            title: 'Actions',
            key: 'actions',
            width: 80,
            render: (_: unknown, r: DevUser) => (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  confirm({
                    title: 'Delete User?',
                    description: `Are you sure you want to permanently delete ${r.firstName} ${r.lastName} (${r.email})? This action cannot be undone.`,
                    tone: 'danger',
                    onConfirm: () => del.run(r.id),
                  })
                }
              />
            ),
          },
        ]}
        mobileCard={(u) => (
          <HumanCard style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <Space size="middle">
                <Avatar size="large" icon={<UserOutlined />} style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>
                    {u.firstName} {u.lastName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                </div>
              </Space>
              <Switch
                checked={u.isActive}
                loading={toggleStatus.loading}
                onChange={(val) => { void toggleStatus.run(u.id, val); }}
                size="small"
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-soft)',
                padding: 12,
                borderRadius: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last Sign In</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{u.lastLoginAt ? formatEventDate(u.lastLoginAt) : 'Never'}</div>
              </div>
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                onClick={() =>
                  confirm({
                    title: 'Delete User?',
                    description: `Are you sure you want to permanently delete ${u.firstName} ${u.lastName} (${u.email})?`,
                    tone: 'danger',
                    onConfirm: () => del.run(u.id),
                  })
                }
              />
            </div>
          </HumanCard>
        )}
        empty={{
          title: 'No customers found',
          description: 'Try refining your search terms.',
          actionLabel: 'Reset Search',
          onAction: () => paged.setFilters({}),
        }}
      />
    </PageShell>
  );
}
