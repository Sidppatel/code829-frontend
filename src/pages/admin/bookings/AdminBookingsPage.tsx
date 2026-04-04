import { Table, Button, Space, Input, Select, App, Popconfirm, Card, Empty, Pagination, Skeleton } from 'antd';
import { SearchOutlined, DownloadOutlined, UndoOutlined, CalendarOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';
import { adminBookingsApi } from '../../../services/api';
import { usePagedTable } from '../../../hooks/usePagedTable';
import { centsToUSD } from '../../../utils/currency';
import { formatEventDate } from '../../../utils/date';
import type { Booking, BookingStatus } from '../../../types/booking';
import type { AdminBookingListParams } from '../../../services/adminBookingsApi';
import BookingStatusTag from '../../../components/bookings/BookingStatusTag';
import PageHeader from '../../../components/shared/PageHeader';

export default function AdminBookingsPage() {
  const { message } = App.useApp();
  const { data, total, page, pageSize, loading, setPage, setPageSize, setFilters, refresh } =
    usePagedTable<Booking, AdminBookingListParams>({
      fetcher: adminBookingsApi.list,
      defaultPageSize: 15,
    });

  const handleRefund = async (id: string) => {
    try {
      await adminBookingsApi.refund(id);
      message.success('Booking refunded');
      refresh();
    } catch {
      message.error('Failed to refund booking');
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const res = format === 'csv' ? await adminBookingsApi.exportCsv() : await adminBookingsApi.exportXlsx();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `bookings.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('Export failed');
    }
  };

  const getDetails = (record: Booking): string => {
    if (record.tableLabel) return `Table ${record.tableLabel}`;
    if (record.seatsReserved) return `${record.seatsReserved} seat${record.seatsReserved !== 1 ? 's' : ''}`;
    return '-';
  };

  // ── Desktop columns ──
  const columns = [
    { title: 'Booking #', dataIndex: 'bookingNumber', key: 'bookingNumber' },
    { title: 'Event', dataIndex: 'eventTitle', key: 'eventTitle' },
    { title: 'Customer', dataIndex: 'userName', key: 'userName' },
    { title: 'Status', dataIndex: 'status', key: 'status',
      render: (status: BookingStatus) => <BookingStatusTag status={status} />,
    },
    { title: 'Total', dataIndex: 'totalCents', key: 'totalCents',
      render: (cents: number) => centsToUSD(cents),
    },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt',
      render: (d: string) => formatEventDate(d),
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: Booking) => (
        <Space>
          {record.status === 'Paid' && (
            <Popconfirm title="Refund this booking?" onConfirm={() => handleRefund(record.id)}>
              <Button size="small" icon={<UndoOutlined />}>Refund</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // ── Mobile card ──
  const renderBookingCard = (booking: Booking) => (
    <Card
      key={booking.id}
      size="small"
      style={{ marginBottom: 12 }}
      styles={{ body: { padding: 14 } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {booking.eventTitle}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            #{booking.bookingNumber}
          </div>
        </div>
        <BookingStatusTag status={booking.status} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 14px', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
        <span><UserOutlined style={{ marginRight: 4 }} />{booking.userName}</span>
        <span><CalendarOutlined style={{ marginRight: 4 }} />{formatEventDate(booking.createdAt)}</span>
        <span>{getDetails(booking)}</span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          <DollarOutlined style={{ marginRight: 4 }} />{centsToUSD(booking.totalCents)}
        </span>
      </div>

      {booking.status === 'Paid' && (
        <Popconfirm title="Refund this booking?" onConfirm={() => handleRefund(booking.id)}>
          <Button size="small" icon={<UndoOutlined />} danger>
            Refund
          </Button>
        </Popconfirm>
      )}
    </Card>
  );

  return (
    <div>
      <PageHeader title="Bookings" subtitle="Manage all bookings"
        extra={
          <Space size="small">
            <Button size="small" icon={<DownloadOutlined />} onClick={() => handleExport('csv')}>CSV</Button>
            <Button size="small" icon={<DownloadOutlined />} onClick={() => handleExport('xlsx')}>Excel</Button>
          </Space>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          placeholder="Search bookings..."
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          allowClear
          onChange={(e) => setFilters({ search: e.target.value || undefined })}
          style={{ flex: 1, minWidth: 180 }}
        />
        <Select
          placeholder="Status"
          allowClear
          style={{ minWidth: 130 }}
          onChange={(val) => setFilters({ status: val })}
          options={['Pending', 'Paid', 'CheckedIn', 'Cancelled', 'Refunded'].map((s) => ({ label: s, value: s }))}
        />
      </div>

      {/* Desktop: Table */}
      <div className="desktop-table">
        <div className="responsive-table">
          <Table dataSource={data} columns={columns} rowKey="id" loading={loading}
            scroll={{ x: 600 }}
            pagination={{ current: page, pageSize, total, onChange: (p, ps) => { setPage(p); setPageSize(ps); }, showSizeChanger: true }}
          />
        </div>
      </div>

      {/* Mobile: Cards */}
      <div className="mobile-card-list">
        {loading ? (
          [1, 2, 3].map((i) => (
            <Card key={i} size="small" style={{ marginBottom: 12 }}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          ))
        ) : data.length === 0 ? (
          <Empty description="No bookings found" style={{ padding: '48px 0' }} />
        ) : (
          <>
            {data.map(renderBookingCard)}
            {total > pageSize && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  onChange={setPage}
                  showSizeChanger={false}
                  size="small"
                  simple
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
