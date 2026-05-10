import { useState } from 'react';
import {
  App,
  Avatar,
  Button,
  Descriptions,
  Drawer,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import {
  EditOutlined,
  LinkOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { organizationsApi } from '@code829/shared/services/organizationsApi';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import { useOrganizationStripeStatus } from '@code829/shared/hooks/useOrganizationStripeStatus';
import type {
  OrganizationDetail,
  OrganizationUpdateRequest,
} from '@code829/shared/types/organizations';
import StatusChip from './StatusChip';

interface Props {
  open: boolean;
  organization: OrganizationDetail | null;
  onClose: () => void;
  onChanged: (org: OrganizationDetail) => void;
  onOpenMembers: () => void;
  onOpenStripe: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  Developer: 'red',
  Admin: 'purple',
  Staff: 'blue',
};

export default function OrganizationDetailDrawer({
  open,
  organization,
  onClose,
  onChanged,
  onOpenMembers,
  onOpenStripe,
}: Props) {
  const { message } = App.useApp();
  const isMobile = useIsMobile();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [saving, setSaving] = useState(false);

  const stripe = useOrganizationStripeStatus(open ? organization?.id : undefined);

  if (!organization) return null;

  const startEdit = () => {
    setName(organization.name);
    setLegalName(organization.legalName ?? '');
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const payload: OrganizationUpdateRequest = {
        name,
        legalName: legalName.trim() ? legalName : null,
      };
      const { data } = await organizationsApi.update(organization.id, payload);
      message.success('Saved');
      onChanged(data);
      setEditing(false);
    } catch {
      message.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const status = stripe.data;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={organization.name}
      width={isMobile ? '100%' : 560}
      destroyOnHidden
      extra={
        <Space>
          <Button icon={<EditOutlined />} onClick={startEdit} disabled={editing}>
            Rename
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {editing ? (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Typography.Text strong>Display Name</Typography.Text>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="ant-input"
              style={{ padding: 8 }}
            />
            <Typography.Text strong>Legal Name</Typography.Text>
            <input
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="ant-input"
              style={{ padding: 8 }}
            />
            <Space>
              <Button type="primary" loading={saving} onClick={() => void saveEdit()}>
                Save
              </Button>
              <Button onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
            </Space>
          </Space>
        ) : (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Display Name">
              {organization.name}
            </Descriptions.Item>
            <Descriptions.Item label="Legal Name">
              {organization.legalName ?? (
                <Typography.Text type="secondary">-</Typography.Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Country">
              {organization.countryCode}
            </Descriptions.Item>
            <Descriptions.Item label="State">
              <StatusChip state={organization.stripeState} />
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {new Date(organization.createdAt).toLocaleString()}
            </Descriptions.Item>
            {organization.archivedAt && (
              <Descriptions.Item label="Archived">
                <Tag color="default">
                  {new Date(organization.archivedAt).toLocaleString()}
                </Tag>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}

        <div>
          <Space
            style={{ width: '100%', justifyContent: 'space-between' }}
            wrap
          >
            <Typography.Title level={5} style={{ margin: 0 }}>
              Stripe Connect
            </Typography.Title>
            <Space>
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => void stripe.refresh()}
                loading={stripe.isFetching}
              >
                Refresh
              </Button>
              <Button
                size="small"
                type="primary"
                icon={<LinkOutlined />}
                onClick={onOpenStripe}
              >
                Manage
              </Button>
            </Space>
          </Space>
          <div style={{ marginTop: 12 }}>
            {stripe.isLoading ? (
              <Spin size="small" />
            ) : status ? (
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="State">
                  <StatusChip state={status.state} />
                </Descriptions.Item>
                <Descriptions.Item label="Account">
                  {status.stripeAccount?.accountId ?? (
                    <Typography.Text type="secondary">Not created</Typography.Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Charges">
                  <Tag color={status.stripeAccount?.chargesEnabled ? 'green' : 'default'}>
                    {status.stripeAccount?.chargesEnabled ? 'Enabled' : 'Disabled'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Payouts">
                  <Tag color={status.stripeAccount?.payoutsEnabled ? 'green' : 'default'}>
                    {status.stripeAccount?.payoutsEnabled ? 'Enabled' : 'Disabled'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Bank Account">
                  {status.bankAccountLast4 ?? (
                    <Typography.Text type="secondary">-</Typography.Text>
                  )}
                </Descriptions.Item>
                {status.stripeAccount?.requirementsCurrentlyDue?.length ? (
                  <Descriptions.Item label="Requirements Due">
                    <Space wrap>
                      {status.stripeAccount.requirementsCurrentlyDue.map((r) => (
                        <Tag key={r} color="orange">
                          {r}
                        </Tag>
                      ))}
                    </Space>
                  </Descriptions.Item>
                ) : null}
                {status.expressDashboardUrl && (
                  <Descriptions.Item label="Dashboard">
                    <a
                      href={status.expressDashboardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Express Dashboard
                    </a>
                  </Descriptions.Item>
                )}
              </Descriptions>
            ) : (
              <Typography.Text type="secondary">
                No Stripe data available.
              </Typography.Text>
            )}
          </div>
        </div>

        <div>
          <Space
            style={{ width: '100%', justifyContent: 'space-between' }}
            wrap
          >
            <Typography.Title level={5} style={{ margin: 0 }}>
              Members ({organization.members?.length ?? 0})
            </Typography.Title>
            <Button icon={<TeamOutlined />} onClick={onOpenMembers}>
              Manage Members
            </Button>
          </Space>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {(organization.members ?? []).map((m) => (
              <div key={m.businessUserId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar icon={<UserOutlined />} size="small" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Typography.Text>{m.firstName} {m.lastName}</Typography.Text>
                    <Tag color={ROLE_COLORS[m.role] ?? 'default'}>{m.role}</Tag>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.email}</div>
                </div>
              </div>
            ))}
            {(!organization.members || organization.members.length === 0) && (
              <Typography.Text type="secondary" style={{ textAlign: 'center', padding: '12px 0' }}>
                No members
              </Typography.Text>
            )}
          </div>
        </div>
      </Space>
    </Drawer>
  );
}
