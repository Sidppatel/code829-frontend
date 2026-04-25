import { useEffect, useState } from 'react';
import {
  App,
  Avatar,
  Button,
  Drawer,
  List,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { DeleteOutlined, UserAddOutlined, UserOutlined } from '@ant-design/icons';
import apiClient from '@code829/shared/lib/axios';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import { organizationsApi } from '@code829/shared/services/organizationsApi';
import type {
  OrganizationDetail,
  OrganizationMemberSummary,
} from '@code829/shared/types/organizations';
import type { BusinessUserListItem } from '@code829/shared/types/auth';

interface Props {
  open: boolean;
  organization: OrganizationDetail | null;
  onClose: () => void;
  /** Bubble updated org back so the parent list/drawer share the freshest copy. */
  onChanged: (org: OrganizationDetail) => void;
}

const ROLE_COLORS: Record<string, string> = {
  Developer: 'red',
  Admin: 'purple',
  Staff: 'blue',
};

/**
 * Side drawer for membership management.
 *
 * - Lists current members (with role chip).
 * - Add: pulls candidates from `/admin/staff` and excludes anyone
 *   already in the org so the picker isn't redundant.
 * - Remove: confirms before calling. BE may 409 when removing the
 *   last member of an org with an active connected account; we
 *   surface that response message verbatim.
 */
export default function MembersDrawer({
  open,
  organization,
  onClose,
  onChanged,
}: Props) {
  const { message } = App.useApp();
  const isMobile = useIsMobile();
  const [allUsers, setAllUsers] = useState<BusinessUserListItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pickedUserId, setPickedUserId] = useState<string | undefined>();
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.resolve()
      .then(() => { if (!cancelled) setLoadingUsers(true); })
      .then(() =>
        apiClient.get<{ items: BusinessUserListItem[] }>('/admin/staff', {
          params: { page: 1, pageSize: 200 },
        }),
      )
      .then(({ data }) => {
        if (!cancelled) setAllUsers(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) message.error('Failed to load potential members');
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, message]);

  if (!organization) return null;

  const memberList = organization.members ?? [];
  const memberIds = new Set(memberList.map((m) => m.businessUserId));
  const candidates = allUsers.filter((u) => !memberIds.has(u.businessUserId));

  const addMember = async () => {
    if (!pickedUserId) return;
    setAdding(true);
    try {
      const { data } = await organizationsApi.addMember(organization.id, {
        businessUserId: pickedUserId,
      });
      message.success('Member added');
      setPickedUserId(undefined);
      onChanged(data);
    } catch {
      message.error('Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const removeMember = async (member: OrganizationMemberSummary) => {
    setRemovingId(member.businessUserId);
    try {
      const { data } = await organizationsApi.removeMember(
        organization.id,
        member.businessUserId,
      );
      message.success('Member removed');
      onChanged(data);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? 'Failed to remove member';
      message.error(msg);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Members · ${organization.name}`}
      width={isMobile ? '100%' : 520}
      destroyOnHidden
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Add Member
          </Typography.Title>
          <Space style={{ width: '100%' }} direction="vertical">
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Pick a business user"
              loading={loadingUsers}
              value={pickedUserId}
              onChange={setPickedUserId}
              style={{ width: '100%' }}
              options={candidates.map((u) => ({
                value: u.businessUserId,
                label: `${u.firstName} ${u.lastName} (${u.email})`,
              }))}
              disabled={candidates.length === 0}
            />
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => void addMember()}
              loading={adding}
              disabled={!pickedUserId}
            >
              Add
            </Button>
          </Space>
        </div>

        <List
          itemLayout="horizontal"
          dataSource={memberList}
          locale={{ emptyText: 'No members yet' }}
          renderItem={(m) => (
            <List.Item
              actions={[
                <Popconfirm
                  key="remove"
                  title="Remove member?"
                  description={`Remove ${m.firstName} ${m.lastName} from ${organization.name}?`}
                  okText="Remove"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => void removeMember(m)}
                >
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    loading={removingId === m.businessUserId}
                  >
                    Remove
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                  <Space>
                    <Typography.Text strong>
                      {m.firstName} {m.lastName}
                    </Typography.Text>
                    <Tag color={ROLE_COLORS[m.role] ?? 'default'}>{m.role}</Tag>
                  </Space>
                }
                description={m.email}
              />
            </List.Item>
          )}
        />
      </Space>
    </Drawer>
  );
}
