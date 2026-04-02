import { Button, Table, Tag, Space, Input, Select, App, Popconfirm, Tooltip } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  SendOutlined,
  EyeOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminEventsApi } from '../../../services/api';
import { usePagedTable } from '../../../hooks/usePagedTable';
import { formatEventDate } from '../../../utils/date';
import type { EventDetail } from '../../../types/event';
import type { AdminEventListParams } from '../../../services/adminEventsApi';
import PageHeader from '../../../components/shared/PageHeader';

const STATUS_MAP: Record<string, { className: string; label: string }> = {
  Draft:     { className: 'status-pill status-draft',     label: 'Draft' },
  Published: { className: 'status-pill status-published', label: 'Published' },
  SoldOut:   { className: 'status-pill status-soldout',   label: 'Sold Out' },
  Cancelled: { className: 'status-pill status-cancelled', label: 'Cancelled' },
  Completed: { className: 'status-pill status-completed', label: 'Completed' },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { className: 'status-pill status-draft', label: status };
  return (
    <span className={s.className}>
      <span className="status-pill-dot" />
      {s.label}
    </span>
  );
}

function getLayoutLabel(mode: string): string {
  if (mode === 'Grid') return 'Grid · Table Based';
  if (mode === 'None') return 'General Admission';
  if (mode === 'Map') return 'Map Layout';
  return mode;
}

export default function EventsListPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const {
    data,
    total,
    page,
    pageSize,
    loading,
    setPage,
    setPageSize,
    setFilters,
    refresh,
  } = usePagedTable<EventDetail, AdminEventListParams>({
    fetcher: adminEventsApi.list,
    defaultPageSize: 10,
  });

  const handlePublish = async (id: string) => {
    try {
      await adminEventsApi.changeStatus(id, 'Published');
      message.success('Event published successfully');
      refresh();
    } catch {
      message.error('Failed to publish event');
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text: string, record: EventDetail) => (
        <a
          onClick={() => navigate(`/admin/events/${record.id}`)}
          style={{ fontWeight: 600 }}
        >
          {text}
        </a>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => <StatusPill status={status} />,
    },
    {
      title: 'Date',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 140,
      render: (d: string) => (
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          {formatEventDate(d)}
        </span>
      ),
    },
    {
      title: 'Venue',
      key: 'venue',
      width: 150,
      render: (_: unknown, record: EventDetail) => (
        <span style={{ color: 'var(--text-secondary)' }}>
          {record.venueCity}, {record.venueState}
        </span>
      ),
    },
    {
      title: 'Seating',
      key: 'seating',
      width: 130,
      render: (_: unknown, record: EventDetail) => (
        <Tag style={{ borderRadius: 99 }}>{getLayoutLabel(record.layoutMode)}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 130,
      render: (_: unknown, record: EventDetail) => (
        <Space size={6}>
          {(record.status === 'Draft' || record.status === 'Published') && (
            <Tooltip title="Edit Event">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/admin/events/${record.id}/edit`)}
                style={{ borderRadius: 8 }}
              />
            </Tooltip>
          )}
          {record.status === 'Draft' && (
            <Popconfirm
              title="Publish this event?"
              description="It will become visible to the public."
              onConfirm={() => handlePublish(record.id)}
              okText="Publish"
              okButtonProps={{ style: { background: '#10B981', borderColor: '#10B981' } }}
            >
              <Tooltip title="Publish">
                <Button
                  size="small"
                  icon={<SendOutlined />}
                  style={{ borderRadius: 8, borderColor: '#10B981', color: '#10B981' }}
                />
              </Tooltip>
            </Popconfirm>
          )}
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/admin/events/${record.id}`)}
              style={{ borderRadius: 8 }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle="Manage your events"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/events/new')}
          >
            Create Event
          </Button>
        }
      />

      <div style={{
        display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center'
      }}>
        <Input
          placeholder="Search events..."
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          allowClear
          onChange={(e) => setFilters({ search: e.target.value || undefined })}
          style={{ flex: 1, minWidth: 200, borderRadius: 10 }}
        />
        <Select
          placeholder="All Statuses"
          allowClear
          style={{ minWidth: 160 }}
          onChange={(val) => setFilters({ status: val })}
          options={['Draft', 'Published', 'SoldOut', 'Cancelled', 'Completed'].map(s => ({ label: s, value: s }))}
        />
      </div>

      {/* Mobile card list — hidden on tablet+ */}
      <div className="mobile-card-list">
        {data.map((record) => (
          <div key={record.id} className="event-mobile-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div
                style={{ fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', flex: 1, marginRight: 8 }}
                onClick={() => navigate(`/admin/events/${record.id}`)}
              >
                {record.title}
              </div>
              <StatusPill status={record.status} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <CalendarOutlined style={{ marginRight: 5, color: 'var(--accent-gold)' }} />
                {formatEventDate(record.startDate)}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <EnvironmentOutlined style={{ marginRight: 5, color: 'var(--accent-violet)' }} />
                {record.venueCity}, {record.venueState}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <AppstoreOutlined style={{ marginRight: 5 }} />
                {getLayoutLabel(record.layoutMode)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {(record.status === 'Draft' || record.status === 'Published') && (
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/admin/events/${record.id}/edit`)}
                  style={{ flex: 1, borderRadius: 8 }}
                >
                  Edit
                </Button>
              )}
              {record.status === 'Draft' && (
                <Popconfirm
                  title="Publish this event?"
                  onConfirm={() => handlePublish(record.id)}
                  okText="Publish"
                >
                  <Button size="small" style={{ flex: 1, borderRadius: 8, borderColor: '#10B981', color: '#10B981' }}>
                    <SendOutlined /> Publish
                  </Button>
                </Popconfirm>
              )}
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/admin/events/${record.id}`)}
                style={{ borderRadius: 8 }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table — hidden on mobile */}
      <div className="desktop-table">
        <div className="responsive-table">
          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            loading={loading}
            scroll={{ x: 900 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
              showSizeChanger: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
