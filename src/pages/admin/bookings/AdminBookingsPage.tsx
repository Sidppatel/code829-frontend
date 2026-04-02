import { Table, Button, Space, Input, Select, App, Popconfirm } from 'antd';
import { SearchOutlined, DownloadOutlined, UndoOutlined } from '@ant-design/icons';
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

  return (
    <div>
      <PageHeader title="Bookings" subtitle="Manage all bookings"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={() => handleExport('csv')}>CSV</Button>
            <Button icon={<DownloadOutlined />} onClick={() => handleExport('xlsx')}>Excel</Button>
          </Space>
        }
      />
      <Space style={{ marginBottom: 16 }}>
        <Input placeholder="Search bookings..." prefix={<SearchOutlined />} allowClear
          onChange={(e) => setFilters({ search: e.target.value || undefined })}
          style={{ width: 240 }}
        />
        <Select placeholder="Status" allowClear style={{ width: 140 }}
          onChange={(val) => setFilters({ status: val })}
          options={['Pending', 'Paid', 'CheckedIn', 'Cancelled', 'Refunded'].map((s) => ({ label: s, value: s }))}
        />
      </Space>
      <div className="responsive-table">
        <Table dataSource={data} columns={columns} rowKey="id" loading={loading}
          scroll={{ x: 800 }}
          pagination={{ current: page, pageSize, total, onChange: (p, ps) => { setPage(p); setPageSize(ps); }, showSizeChanger: true }}
        />
      </div>
    </div>
  );
}
