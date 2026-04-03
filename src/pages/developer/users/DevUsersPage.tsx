import { useEffect, useState, useCallback } from 'react';
import { Table, Select, Input, Card, Tag, Pagination, Spin, App } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { developerApi } from '../../../services/api';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useAuth } from '../../../hooks/useAuth';
import { formatEventDate } from '../../../utils/date';
import type { DevUser } from '../../../services/developerApi';
import PageHeader from '../../../components/shared/PageHeader';

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
      setTotal(data.total);
    } catch {
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
      message.success('Role updated');
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    } catch {
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
    <div>
      <PageHeader title="Users" subtitle={`${total} registered users`} />

      <Input
        placeholder="Search by name or email..."
        prefix={<SearchOutlined />}
        allowClear
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        style={{ maxWidth: 300, width: '100%', marginBottom: 16 }}
      />

      {isMobile ? (
        <Spin spinning={loading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.map((u) => (
              <Card key={u.id} size="small" styles={{ body: { padding: 12 } }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                    {u.firstName} {u.lastName}
                  </span>
                  <Tag color={getRoleColor(u.role)} style={{ margin: 0 }}>{u.role}</Tag>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.email}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatEventDate(u.createdAt)}</span>
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
              </Card>
            ))}
            {users.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No users found</div>
            )}
          </div>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              current={page} pageSize={pageSize} total={total} size="small"
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
            />
          </div>
        </Spin>
      ) : (
        <div className="responsive-table">
          <Table
            dataSource={users}
            columns={columns}
            rowKey="id"
            loading={loading}
            size="small"
            scroll={{ x: 600 }}
            pagination={{
              current: page, pageSize, total,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); },
              showSizeChanger: true,
            }}
          />
        </div>
      )}
    </div>
  );
}
