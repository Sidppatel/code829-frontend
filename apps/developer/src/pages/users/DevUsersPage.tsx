import { useEffect, useState, useCallback } from 'react';
import { Table, Input, Tag, Pagination, Spin, App, Button, Switch, Space, Typography, Tooltip, Avatar } from 'antd';
import { SearchOutlined, DeleteOutlined, UserOutlined, MailOutlined, PhoneOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { developerApi } from '../../services/api';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import { formatEventDate } from '@code829/shared/utils/date';
import type { DevUser } from '@code829/shared/services/developerApi';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import EmptyState from '@code829/shared/components/shared/EmptyState';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Developer/UsersPage');

export default function DevUsersPage() {
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<DevUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { message, modal } = App.useApp();

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

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    setUpdatingId(userId);
    try {
      await developerApi.updateUserStatus(userId, isActive);
      message.success(isActive ? 'Account activated' : 'Account deactivated');
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive } : u));
    } catch (err) {
      message.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = (user: DevUser) => {
    modal.confirm({
      title: 'Delete User?',
      content: `Are you sure you want to permanently delete ${user.firstName} ${user.lastName} (${user.email})? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await developerApi.deleteUser(user.id);
          message.success('User deleted');
          void load();
        } catch {
          message.error('Failed to delete user');
        }
      }
    });
  };

  const columns = [
    {
      title: 'Customer',
      key: 'customer',
      render: (_: unknown, r: DevUser) => (
        <Space size="middle">
          <Avatar icon={<UserOutlined />} style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{r.firstName} {r.lastName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.email}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: unknown, r: DevUser) => (
        <Space direction="vertical" size={0}>
          <Typography.Text style={{ fontSize: 13 }}><MailOutlined style={{ marginRight: 8, opacity: 0.5 }} />{r.email}</Typography.Text>
          {r.phone && <Typography.Text style={{ fontSize: 13 }}><PhoneOutlined style={{ marginRight: 8, opacity: 0.5 }} />{r.phone}</Typography.Text>}
        </Space>
      )
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
            loading={updatingId === r.id}
            onChange={(val) => handleStatusChange(r.id, val)} 
            size="small"
          />
        </Tooltip>
      )
    },
    {
      title: 'Last Seen',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 180,
      render: (d?: string) => d ? formatEventDate(d) : <Tag>Never</Tag>
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
          onClick={() => handleDelete(r)}
        />
      )
    }
  ];

  return (
    <div style={{ padding: isMobile ? 20 : '32px 40px' }}>
      <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
        {total.toLocaleString()} non-administrative accounts
      </div>
      <h1
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: isMobile ? 26 : 34,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.025em',
          margin: '0 0 24px',
          lineHeight: 1.1,
        }}
      >
        Customers
      </h1>

      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 32,
        flexWrap: 'wrap',
        alignItems: 'center',
        background: 'var(--bg-card)',
        padding: '16px 24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <Input
          placeholder="Search by name or email..."
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          className="premium-input"
          allowClear
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1, minWidth: 260, height: 40 }}
        />
        <Space size="middle">
          <Tag icon={<SafetyCertificateOutlined />} color="success" style={{ padding: '4px 12px', borderRadius: 20 }}>
            {total} Total Customers
          </Tag>
        </Space>
      </div>

      {isMobile ? (
        <Spin spinning={loading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {users.map((u) => (
              <HumanCard key={u.id} style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <Space size="middle">
                    <Avatar size="large" icon={<UserOutlined />} style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }} />
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{u.firstName} {u.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                  </Space>
                  <Switch 
                    checked={u.isActive} 
                    loading={updatingId === u.id}
                    onChange={(val) => handleStatusChange(u.id, val)}
                    size="small"
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-soft)', padding: 12, borderRadius: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last Sign In</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{u.lastLoginAt ? formatEventDate(u.lastLoginAt) : 'Never'}</div>
                  </div>
                  <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleDelete(u)} />
                </div>
              </HumanCard>
            ))}
            {users.length === 0 && !loading && (
              <EmptyState 
                title="No customers found" 
                description="Try refining your search terms." 
                actionLabel="Reset Search" 
                onAction={() => { setSearch(''); setPage(1); }} 
              />
            )}
          </div>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              current={page} pageSize={pageSize} total={total}
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
              showSizeChanger
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
              size="large"
              scroll={{ x: 800 }}
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
