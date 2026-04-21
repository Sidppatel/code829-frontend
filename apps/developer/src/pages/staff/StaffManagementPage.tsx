import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Select, Switch, Typography, Card, Input, Space, App, Tag } from 'antd';
import { UserAddOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '@code829/shared/lib/axios';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import type { BusinessUserListItem } from '@code829/shared/types/auth';

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<BusinessUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { message } = App.useApp();

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/admin/staff', { params: { page, pageSize: 25, search: search || undefined } });
      setStaff(data.items);
      setTotal(data.totalCount);
    } catch { message.error('Failed to load staff'); }
    finally { setLoading(false); }
  }, [page, search, message]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => { if (!cancelled) setLoading(true); })
      .then(() => apiClient.get('/admin/staff', { params: { page, pageSize: 25, search: search || undefined } }))
      .then(({ data }) => { if (!cancelled) { setStaff(data.items); setTotal(data.totalCount); } })
      .catch(() => { if (!cancelled) message.error('Failed to load staff'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, search, message]);

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await apiClient.put(`/admin/staff/${id}`, { isActive });
      message.success(isActive ? 'Account enabled' : 'Account disabled');
      void fetchStaff();
    } catch { message.error('Failed to update status'); }
  };

  const updateRole = async (id: string, role: string) => {
    try {
      await apiClient.put(`/admin/staff/${id}`, { role });
      message.success('Role updated');
      void fetchStaff();
    } catch { message.error('Failed to update role'); }
  };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Staff Management" subtitle="Manage staff accounts" />
      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
          <Input placeholder="Search staff..." prefix={<SearchOutlined />} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ width: 300 }} allowClear />
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => navigate('/invitations')}>Invite Staff</Button>
        </Space>
        <Table dataSource={staff} rowKey="businessUserId" loading={loading} pagination={{ current: page, total, pageSize: 25, onChange: setPage }}
          columns={[
            { title: 'Name', render: (_: unknown, r: BusinessUserListItem) => `${r.firstName} ${r.lastName}` },
            { title: 'Email', dataIndex: 'email' },
            {
              title: 'Role',
              dataIndex: 'role',
              render: (r: string, record: BusinessUserListItem) => (
                <Select
                  value={r}
                  size="small"
                  style={{ width: 120 }}
                  onChange={v => updateRole(record.businessUserId, v)}
                  options={[
                    { value: 'Developer', label: <Tag color="red">Developer</Tag> },
                    { value: 'Admin', label: <Tag color="purple">Admin</Tag> },
                    { value: 'Staff', label: <Tag color="blue">Staff</Tag> },
                  ]}
                />
              )
            },
            { title: 'Status', dataIndex: 'isActive', render: (active: boolean, r: BusinessUserListItem) => <Switch checked={active} onChange={v => toggleActive(r.businessUserId, v)} checkedChildren="Active" unCheckedChildren="Disabled" /> },
            { title: 'Last Login', dataIndex: 'lastLoginAt', render: (d?: string) => d ? new Date(d).toLocaleDateString() : <Typography.Text type="secondary">Never</Typography.Text> },
          ]}
        />
      </Card>
    </div>
  );
}
