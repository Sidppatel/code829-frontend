import { useState, useEffect, useCallback } from 'react';
import { Table, Switch, Typography, Card, Input, Space, App, Tag, Button } from 'antd';
import { SearchOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '@code829/shared/lib/axios';
import PageHeader from '@code829/shared/components/shared/PageHeader';

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export default function AdminManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { message } = App.useApp();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/admin/staff', { params: { page, pageSize: 25, search: search || undefined } });
      setUsers(data.items);
      setTotal(data.totalCount);
    } catch { message.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search, message]);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await apiClient.put(`/admin/staff/${id}`, { isActive });
      message.success(isActive ? 'Account enabled' : 'Account disabled');
      void fetchUsers();
    } catch { message.error('Failed to update status'); }
  };

  const ROLE_COLORS: Record<string, string> = { Developer: 'red', Admin: 'purple', Staff: 'blue' };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Admin Management" subtitle="Manage admin accounts" />
      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
          <Input placeholder="Search..." prefix={<SearchOutlined />} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ width: 300 }} allowClear />
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => navigate('/invitations')}>Invite</Button>
        </Space>
        <Table dataSource={users} rowKey="id" loading={loading} pagination={{ current: page, total, pageSize: 25, onChange: setPage }}
          columns={[
            { title: 'Name', render: (_: unknown, r: AdminUser) => `${r.firstName} ${r.lastName}` },
            { title: 'Email', dataIndex: 'email' },
            { title: 'Role', dataIndex: 'role', render: (r: string) => <Tag color={ROLE_COLORS[r] || 'default'}>{r}</Tag> },
            { title: 'Status', dataIndex: 'isActive', render: (active: boolean, r: AdminUser) => <Switch checked={active} onChange={v => toggleActive(r.id, v)} checkedChildren="Active" unCheckedChildren="Disabled" /> },
            { title: 'Last Login', dataIndex: 'lastLoginAt', render: (d?: string) => d ? new Date(d).toLocaleDateString() : <Typography.Text type="secondary">Never</Typography.Text> },
          ]}
        />
      </Card>
    </div>
  );
}
