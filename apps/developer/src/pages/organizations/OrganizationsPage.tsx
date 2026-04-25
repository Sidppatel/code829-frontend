import { useCallback, useEffect, useState } from 'react';
import {
  App,
  Avatar,
  Button,
  Card,
  Input,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { organizationsApi } from '@code829/shared/services/organizationsApi';
import {
  DataTableSection,
  PageShell,
} from '@code829/shared/components/ui';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import type {
  OrganizationDetail,
  OrganizationListItem,
} from '@code829/shared/types/organizations';
import StatusChip from './components/StatusChip';
import NewOrganizationModal from './components/NewOrganizationModal';
import OrganizationDetailDrawer from './components/OrganizationDetailDrawer';
import MembersDrawer from './components/MembersDrawer';
import StripeOnboardingModal from './components/StripeOnboardingModal';

/**
 * Developer-only org administration surface.
 *
 * Single page that orchestrates four overlays — detail / members /
 * stripe / new — keyed off a single `selectedOrg` so reopening an
 * overlay always sees the freshest data after a mutation.
 *
 * Pagination is server-driven (`/developer/organizations`); listing
 * is intentionally simple: search + archived toggle. Stripe state per
 * row comes pre-computed from the BE (no FE derivation).
 */
export default function OrganizationsPage() {
  const { message } = App.useApp();
  const [items, setItems] = useState<OrganizationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);

  const [selected, setSelected] = useState<OrganizationDetail | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showStripe, setShowStripe] = useState(false);

  const loadList = useCallback(() => {
    setLoading(true);
    organizationsApi
      .list({
        page,
        pageSize,
        search: search || undefined,
        includeArchived,
      })
      .then(({ data }) => {
        setItems(data.items);
        setTotal(data.totalCount);
      })
      .catch(() => message.error('Failed to load organizations'))
      .finally(() => setLoading(false));
  }, [page, pageSize, search, includeArchived, message]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => { if (!cancelled) setLoading(true); })
      .then(() =>
        organizationsApi.list({
          page,
          pageSize,
          search: search || undefined,
          includeArchived,
        }),
      )
      .then(({ data }) => {
        if (!cancelled) {
          setItems(data.items);
          setTotal(data.totalCount);
        }
      })
      .catch(() => {
        if (!cancelled) message.error('Failed to load organizations');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, search, includeArchived, message]);

  const openDetail = async (row: OrganizationListItem) => {
    try {
      const { data } = await organizationsApi.getById(row.id);
      setSelected(data);
      setShowDetail(true);
    } catch {
      message.error('Failed to load organization');
    }
  };

  const handleCreated = (org: OrganizationDetail) => {
    setSelected(org);
    setShowCreate(false);
    setShowDetail(true);
    loadList();
  };

  const handleChanged = (org: OrganizationDetail) => {
    setSelected(org);
    loadList();
  };

  return (
    <PageShell
      title="Organizations"
      subtitle={`${total.toLocaleString()} organization${total === 1 ? '' : 's'}`}
      extra={
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadList}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowCreate(true)}
          >
            New Organization
          </Button>
        </Space>
      }
    >
      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Input
            placeholder="Search by name or legal name"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: 320 }}
            allowClear
          />
          <Space>
            <Typography.Text>Show archived</Typography.Text>
            <Switch
              checked={includeArchived}
              onChange={(v) => {
                setIncludeArchived(v);
                setPage(1);
              }}
            />
          </Space>
        </Space>
      </Card>

      <DataTableSection<OrganizationListItem>
        data={items}
        total={total}
        page={page}
        pageSize={pageSize}
        loading={loading}
        onPageChange={(p, ps) => {
          setPage(p);
          setPageSize(ps);
        }}
        rowKey="id"
        size="middle"
        scrollX={900}
        onRowClick={openDetail}
        columns={[
          {
            title: 'Name',
            key: 'name',
            render: (_: unknown, r: OrganizationListItem) => (
              <Space>
                <Avatar
                  size="small"
                  icon={<TeamOutlined />}
                  style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                />
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{r.name}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {r.countryCode}
                  </Typography.Text>
                </Space>
              </Space>
            ),
          },
          {
            title: 'Stripe State',
            key: 'state',
            render: (_: unknown, r: OrganizationListItem) => (
              <StatusChip state={r.stripeState} />
            ),
          },
          {
            title: 'Account',
            key: 'account',
            render: (_: unknown, r: OrganizationListItem) =>
              r.hasStripeAccount ? (
                <Tag color="green">Connected</Tag>
              ) : (
                <Tag color="default">Not Connected</Tag>
              ),
          },
          {
            title: 'Members',
            dataIndex: 'memberCount',
            key: 'memberCount',
            width: 110,
            render: (n: number) => <Tag>{n}</Tag>,
          },
          {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 140,
            render: (d: string) => new Date(d).toLocaleDateString(),
          },
          {
            title: 'Status',
            key: 'archived',
            width: 110,
            render: (_: unknown, r: OrganizationListItem) =>
              r.archivedAt ? (
                <Tag color="default">Archived</Tag>
              ) : (
                <Tag color="blue">Live</Tag>
              ),
          },
        ]}
        mobileCard={(r) => (
          <HumanCard
            style={{ padding: 16, cursor: 'pointer' }}
            onClick={() => void openDetail(r)}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 12,
              }}
            >
              <Space size="middle">
                <Avatar
                  icon={<TeamOutlined />}
                  style={{
                    background: 'var(--primary-soft)',
                    color: 'var(--primary)',
                  }}
                />
                <div>
                  <div style={{ fontWeight: 700 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {r.countryCode} · {r.memberCount} members
                  </div>
                </div>
              </Space>
              <StatusChip state={r.stripeState} />
            </div>
            <Space>
              {r.hasStripeAccount ? (
                <Tag color="green">Connected</Tag>
              ) : (
                <Tag>Not Connected</Tag>
              )}
              {r.archivedAt && <Tag>Archived</Tag>}
            </Space>
          </HumanCard>
        )}
        empty={{
          title: 'No organizations yet',
          description: 'Create the first organization to enable Stripe payouts.',
          actionLabel: 'New Organization',
          onAction: () => setShowCreate(true),
        }}
      />

      <NewOrganizationModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />

      <OrganizationDetailDrawer
        open={showDetail}
        organization={selected}
        onClose={() => setShowDetail(false)}
        onChanged={handleChanged}
        onOpenMembers={() => setShowMembers(true)}
        onOpenStripe={() => setShowStripe(true)}
      />

      <MembersDrawer
        open={showMembers}
        organization={selected}
        onClose={() => setShowMembers(false)}
        onChanged={handleChanged}
      />

      <StripeOnboardingModal
        open={showStripe}
        organization={selected}
        onClose={() => setShowStripe(false)}
        onAccountStarted={() => {
          if (selected) {
            void organizationsApi.getById(selected.id).then(({ data }) => {
              setSelected(data);
              loadList();
            });
          }
        }}
      />
    </PageShell>
  );
}
