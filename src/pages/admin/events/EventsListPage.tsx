import { Button, Table, Tag, Space, Input, Select, App, Popconfirm } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminEventsApi } from '../../../services/api';
import { usePagedTable } from '../../../hooks/usePagedTable';
import { centsToUSD } from '../../../utils/currency';
import { formatEventDate } from '../../../utils/date';
import type { EventDetail } from '../../../types/event';
import type { AdminEventListParams } from '../../../services/adminEventsApi';
import PageHeader from '../../../components/shared/PageHeader';

const statusColors: Record<string, string> = {
  Draft: 'default',
  Published: 'green',
  SoldOut: 'gold',
  Cancelled: 'red',
  Completed: 'blue',
};

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

  const handleDelete = async (id: string) => {
    try {
      await adminEventsApi.delete(id);
      message.success('Event deleted');
      refresh();
    } catch {
      message.error('Failed to delete event');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await adminEventsApi.duplicate(
        id,
        new Date().toISOString(),
        new Date().toISOString(),
      );
      message.success('Event duplicated');
      refresh();
    } catch {
      message.error('Failed to duplicate event');
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: EventDetail) => (
        <a onClick={() => navigate(`/admin/events/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] ?? 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (d: string) => formatEventDate(d),
    },
    {
      title: 'Venue',
      dataIndex: 'venueName',
      key: 'venueName',
    },
    {
      title: 'Tickets',
      key: 'tickets',
      render: (_: unknown, r: EventDetail) =>
        `${r.quantitySold} / ${r.quantityTotal}`,
    },
    {
      title: 'Price',
      key: 'price',
      render: (_: unknown, r: EventDetail) =>
        r.minPriceCents != null ? centsToUSD(r.minPriceCents) : '\u2014',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: EventDetail) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/events/${record.id}`)}
          />
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleDuplicate(record.id)}
          />
          <Popconfirm
            title="Delete this event?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
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
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search events..."
          prefix={<SearchOutlined />}
          allowClear
          onChange={(e) =>
            setFilters({ search: e.target.value || undefined })
          }
          style={{ width: 240 }}
        />
        <Select
          placeholder="Status"
          allowClear
          style={{ width: 140 }}
          onChange={(val) => setFilters({ status: val })}
          options={[
            'Draft',
            'Published',
            'SoldOut',
            'Cancelled',
            'Completed',
          ].map((s) => ({ label: s, value: s }))}
        />
      </Space>
      <div className="responsive-table">
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 800 }}
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
  );
}
