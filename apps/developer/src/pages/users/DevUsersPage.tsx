import { useEffect, useState, useCallback } from 'react';
import { Table, Select, Input, Tag, Pagination, Spin, App } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { developerApi } from '../../services/api';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import { useAuth } from '@code829/shared/hooks/useAuth';
import { formatEventDate } from '@code829/shared/utils/date';
import type { DevUser } from '@code829/shared/services/developerApi';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import EmptyState from '@code829/shared/components/shared/EmptyState';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Developer/UsersPage');

const allRoles = ['User', 'Staff', 'Admin', 'Developer'];

function getRoleColor(role: string): string {
  switch (role) {
    case 'Developer': return 'purple';
    case 'Admin': return 'red';
    case 'Staff': return 'blue';
    default: return 'default';
  }
}

export default function DevUsersPage() {
  const isMobile = useIsMobile();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<DevUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { message } = App.useApp();

  const isDeveloper = currentUser?.role === 'Developer';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await developerApi.getUsers({ page, pageSize, search: search || undefined });
      setUsers(data.items);
      setTotal(data.totalCount);
      log.info('Users loaded', { count: data.items.length, total: data.totalCount });
    } catch (err) {
      log.error('Failed to load users', err);
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, message]);

  useEffect(() => { void load(); }, [load]);

  const handleRoleChange = async (userId: string, role: string) => {
    setUpdatingId(userId);
    try {
      await developerApi.updateUserRole(userId, role);
      log.info('User role updated', { userId, role });
      message.success('Role updated');
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    } catch (err) {
      log.error('Failed to update user role', err);
      message.error('Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleOptions = (userRole: string) => {
    if (userRole === 'Developer') return [{ label: 'Developer', value: 'Developer' }];
    if (!isDeveloper) return allRoles.filter((r) => r !== 'Developer').map((r) => ({ label: r, value: r }));
    return allRoles.filter((r) => r !== 'Developer').map((r) => ({ label: r, value: r }));
  };

  const columns = [
    { title: 'Email', dataIndex: 'email', key: 'email', ellipsis: true },
    { title: 'First Name', dataIndex: 'firstName', key: 'firstName' },
    { title: 'Last Name', dataIndex: 'lastName', key: 'lastName' },
    {
      title: 'Role', dataIndex: 'role', key: 'role', width: 150,
      render: (role: string, record: DevUser) => (
        <Select
          value={role}
          options={getRoleOptions(role)}
          style={{ width: 130 }}
          loading={updatingId === record.id}
          disabled={record.role === 'Developer'}
          onChange={(val) => handleRoleChange(record.id, val)}
        />
      ),
    },
    {
      title: 'Created', dataIndex: 'createdAt', key: 'createdAt', width: 180,
      render: (d: string) => formatEventDate(d),
    },
  ];

  return (
    <div className="spring-up">
      <PageHeader
        title="User Management"
        subtitle={[
          `${total} authenticated users across all environments.`,
          "Review and adjust permission scopes below.",
          "High volume of new sign-ups detected this morning."
        ]}
        rotateSubtitle
      />

      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 32,
        flexWrap: 'wrap',
        alignItems: 'center',
        background: 'var(--bg-surface)',
        padding: '12px 20px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <Input
          placeholder="Search by name or email..."
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          variant="borderless"
          allowClear
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1, minWidth: 260, height: 32, fontSize: 13 }}
        />
        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}>All Roles</Tag>
          <Tag color="default" style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}>Active Only</Tag>
        </div>
      </div>

      {isMobile ? (
        <Spin spinning={loading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {users.map((u) => (
              <HumanCard key={u.id} className="human-noise" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: 12
                    }}>
                      {u.firstName?.[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {u.firstName} {u.lastName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{u.email}</div>
                    </div>
                  </div>
                  <Tag color={getRoleColor(u.role)} style={{ margin: 0, borderRadius: 6, fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>
                    {u.role}
                  </Tag>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-soft)', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Joined</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{formatEventDate(u.createdAt)}</div>
                  </div>
                  {u.role !== 'Developer' && (
                    <Select
                      value={u.role}
                      options={getRoleOptions(u.role)}
                      size="small"
                      style={{ width: 110 }}
                      loading={updatingId === u.id}
                      onChange={(val) => handleRoleChange(u.id, val)}
                    />
                  )}
                </div>
              </HumanCard>
            ))}
            {users.length === 0 && !loading && (
              <EmptyState title="No users found" description="Try refining your search terms." actionLabel="Reset Search" onAction={() => { setSearch(''); setPage(1); }} />
            )}
          </div>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              current={page} pageSize={pageSize} total={total} size="small"
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
              className="human-pagination"
            />
          </div>
        </Spin>
      ) : (
        <HumanCard>
          <div className="responsive-table">
            <Table
              dataSource={users}
              columns={columns}
              rowKey="id"
              loading={loading}
              size="middle"
              scroll={{ x: 600 }}
              pagination={{
                current: page, pageSize, total,
                onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                showSizeChanger: true,
                className: 'human-pagination'
              }}
            />
          </div>
        </HumanCard>
      )}
    </div>
  );
}
