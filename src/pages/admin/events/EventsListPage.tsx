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
  TeamOutlined,
  ScanOutlined,
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

function LayoutModeTag({ mode }: { mode: string }) {
  if (mode === 'Grid') {
    return (
      <Tag color="purple" style={{ borderRadius: 99 }}>
        <AppstoreOutlined style={{ marginRight: 4 }} />Grid
      </Tag>
    );
  }
  if (mode === 'Open') {
    return (
      <Tag color="blue" style={{ borderRadius: 99 }}>
        <TeamOutlined style={{ marginRight: 4 }} />Open
      </Tag>
    );
  }
  return <Tag style={{ borderRadius: 99 }}>{mode}</Tag>;
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
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 110,
      render: (cat: string) => (
        <span style={{ color: 'var(--text-secondary)' }}>{cat}</span>
      ),
    },
    {
      title: 'Venue',
      key: 'venue',
      width: 150,
      render: (_: unknown, record: EventDetail) => (
        <span style={{ color: 'var(--text-secondary)' }}>
          {record.venueName}
        </span>
      ),
    },
    {
      title: 'Layout',
      key: 'layoutMode',
      width: 100,
      render: (_: unknown, record: EventDetail) => (
        <LayoutModeTag mode={record.layoutMode} />
      ),
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
            >
              <Tooltip title="Publish">
                <Button
                  size="small"
                  icon={<SendOutlined />}
                  style={{ borderRadius: 8, borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}
                />
              </Tooltip>
            </Popconfirm>
          )}
          {(record.status === 'Published' || record.status === 'Completed') && (
            <Tooltip title="Check-In">
              <Button
                size="small"
                icon={<ScanOutlined />}
                onClick={() => navigate(`/admin/checkin/${record.id}`)}
                style={{ borderRadius: 8, borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}
              />
            </Tooltip>
          )}
          <Tooltip title="Manage">
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

      {/* Mobile card list -- hidden on tablet+ */}
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
                {record.venueName}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <LayoutModeTag mode={record.layoutMode} />
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
                  <Button size="small" style={{ flex: 1, borderRadius: 8, borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}>
                    <SendOutlined /> Publish
                  </Button>
                </Popconfirm>
              )}
              {(record.status === 'Published' || record.status === 'Completed') && (
                <Button
                  size="small"
                  icon={<ScanOutlined />}
                  onClick={() => navigate(`/admin/checkin/${record.id}`)}
                  style={{ flex: 1, borderRadius: 8, borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}
                >
                  Check-In
                </Button>
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

      {/* Desktop table -- hidden on mobile */}
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
