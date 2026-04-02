import { useEffect, useState } from 'react';
import { Table, Select, App } from 'antd';
import { developerApi } from '../../../services/api';
import { formatEventDate } from '../../../utils/date';
import type { DevUser } from '../../../services/developerApi';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

const roleOptions = ['User', 'Staff', 'Admin', 'Developer'].map((r) => ({ label: r, value: r }));

export default function DevUsersPage() {
  const [users, setUsers] = useState<DevUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { message } = App.useApp();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await developerApi.getUsers();
      setUsers(data);
    } catch {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

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

  const columns = [
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'First Name', dataIndex: 'firstName', key: 'firstName' },
    { title: 'Last Name', dataIndex: 'lastName', key: 'lastName' },
    {
      title: 'Role', dataIndex: 'role', key: 'role',
      render: (role: string, record: DevUser) => (
        <Select value={role} options={roleOptions} style={{ width: 130 }}
          loading={updatingId === record.id}
          onChange={(val) => handleRoleChange(record.id, val)}
        />
      ),
    },
    {
      title: 'Created', dataIndex: 'createdAt', key: 'createdAt',
      render: (d: string) => formatEventDate(d),
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Users" subtitle={`${users.length} registered users`} />
      <div className="responsive-table">
        <Table dataSource={users} columns={columns} rowKey="id" scroll={{ x: 600 }}
          pagination={{ pageSize: 25, showSizeChanger: true }}
        />
      </div>
    </div>
  );
}
