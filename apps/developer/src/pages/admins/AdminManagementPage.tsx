import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Select,
  Switch,
  Typography,
  Card,
  Input,
  Space,
  App,
  Tag,
  Button,
  Dropdown,
  Modal,
} from 'antd';
import {
  SearchOutlined,
  UserAddOutlined,
  MoreOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '@code829/shared/lib/axios';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import { organizationsApi } from '@code829/shared/services/organizationsApi';
import type { BusinessUserListItem } from '@code829/shared/types/auth';
import type {
  OrganizationDetail,
  OrganizationListItem,
} from '@code829/shared/types/organizations';

interface AdminOrgEntry {
  organizationId: string;
  organizationName: string;
}

export default function AdminManagementPage() {
  const [users, setUsers] = useState<BusinessUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [orgs, setOrgs] = useState<OrganizationListItem[]>([]);
  const [orgMap, setOrgMap] = useState<Record<string, AdminOrgEntry>>({});
  const [moveTarget, setMoveTarget] = useState<BusinessUserListItem | null>(null);
  const [movePicked, setMovePicked] = useState<string | undefined>();
  const [moving, setMoving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/admin/staff', { params: { page, pageSize: 25, search: search || undefined } });
      setUsers(data.items);
      setTotal(data.totalCount);
    } catch { message.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search, message]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => { if (!cancelled) setLoading(true); })
      .then(() => apiClient.get('/admin/staff', { params: { page, pageSize: 25, search: search || undefined } }))
      .then(({ data }) => { if (!cancelled) { setUsers(data.items); setTotal(data.totalCount); } })
      .catch(() => { if (!cancelled) message.error('Failed to load users'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, search, message]);

  const loadOrgMap = useCallback(async () => {
    try {
      const { data } = await organizationsApi.list({ page: 1, pageSize: 200 });
      setOrgs(data.items);
      const detailResponses = await Promise.all(
        data.items.map((o) => organizationsApi.getById(o.id).then((r) => r.data)),
      );
      const next: Record<string, AdminOrgEntry> = {};
      detailResponses.forEach((d: OrganizationDetail) => {
        d.members.forEach((m) => {
          next[m.businessUserId] = {
            organizationId: d.id,
            organizationName: d.name,
          };
        });
      });
      setOrgMap(next);
    } catch {
      // silent - column will just show "-" if the dev backend is offline
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void loadOrgMap();
    });
    return () => {
      cancelled = true;
    };
  }, [loadOrgMap]);

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await apiClient.put(`/admin/staff/${id}`, { isActive });
      message.success(isActive ? 'Account enabled' : 'Account disabled');
      void fetchUsers();
    } catch { message.error('Failed to update status'); }
  };

  const updateRole = async (id: string, role: string) => {
    try {
      await apiClient.put(`/admin/staff/${id}`, { role });
      message.success('Role updated');
      void fetchUsers();
    } catch { message.error('Failed to update role'); }
  };

  const openMove = (user: BusinessUserListItem) => {
    setMoveTarget(user);
    setMovePicked(orgMap[user.businessUserId]?.organizationId);
  };

  const closeMove = () => {
    setMoveTarget(null);
    setMovePicked(undefined);
  };

  const submitMove = async () => {
    if (!moveTarget || !movePicked) return;
    setMoving(true);
    try {
      const current = orgMap[moveTarget.businessUserId];
      if (current && current.organizationId !== movePicked) {
        try {
          await organizationsApi.removeMember(
            current.organizationId,
            moveTarget.businessUserId,
          );
        } catch (err) {
          const msg =
            (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message ?? 'Failed to remove from current organization';
          message.error(msg);
          setMoving(false);
          return;
        }
      }
      await organizationsApi.addMember(movePicked, {
        businessUserId: moveTarget.businessUserId,
      });
      message.success('Moved');
      closeMove();
      void loadOrgMap();
    } catch {
      message.error('Failed to move user');
    } finally {
      setMoving(false);
    }
  };

  const orgOptions = useMemo(
    () =>
      orgs.map((o) => ({
        value: o.id,
        label: o.name,
      })),
    [orgs],
  );

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Admin Management" subtitle="Manage admin accounts" />
      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
          <Input placeholder="Search..." prefix={<SearchOutlined />} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ width: 300 }} allowClear />
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => navigate('/invitations')}>Invite</Button>
        </Space>
        <Table dataSource={users} rowKey="businessUserId" loading={loading} pagination={{ current: page, total, pageSize: 25, onChange: setPage }}
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
            {
              title: 'Organization',
              key: 'organization',
              render: (_: unknown, r: BusinessUserListItem) => {
                const entry = orgMap[r.businessUserId];
                return entry ? (
                  <Link to="/organizations">{entry.organizationName}</Link>
                ) : (
                  <Typography.Text type="secondary">-</Typography.Text>
                );
              },
            },
            { title: 'Status', dataIndex: 'isActive', render: (active: boolean, r: BusinessUserListItem) => <Switch checked={active} onChange={v => toggleActive(r.businessUserId, v)} checkedChildren="Active" unCheckedChildren="Disabled" /> },
            { title: 'Last Login', dataIndex: 'lastLoginAt', render: (d?: string) => d ? new Date(d).toLocaleDateString() : <Typography.Text type="secondary">Never</Typography.Text> },
            {
              title: '',
              key: 'actions',
              width: 64,
              render: (_: unknown, r: BusinessUserListItem) => (
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'move',
                        icon: <SwapOutlined />,
                        label: 'Move to organization',
                        onClick: () => openMove(r),
                      },
                    ],
                  }}
                  trigger={['click']}
                >
                  <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={Boolean(moveTarget)}
        title={
          moveTarget
            ? `Move ${moveTarget.firstName} ${moveTarget.lastName}`
            : 'Move user'
        }
        onCancel={closeMove}
        onOk={() => void submitMove()}
        okText="Move"
        confirmLoading={moving}
        okButtonProps={{ disabled: !movePicked }}
        destroyOnHidden
      >
        <Space orientation="vertical" style={{ width: '100%' }}>
          {moveTarget && orgMap[moveTarget.businessUserId] && (
            <Typography.Text type="secondary">
              Current: {orgMap[moveTarget.businessUserId].organizationName}
            </Typography.Text>
          )}
          <Select
            showSearch
            optionFilterProp="label"
            value={movePicked}
            onChange={setMovePicked}
            placeholder="Pick destination organization"
            options={orgOptions}
            style={{ width: '100%' }}
          />
        </Space>
      </Modal>
    </div>
  );
}
