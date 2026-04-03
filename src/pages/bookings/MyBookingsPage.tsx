import { useState, useCallback } from 'react';
import { Table, Button, App, Space, Modal, Image } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { QrcodeOutlined } from '@ant-design/icons';
import { bookingsApi } from '../../services/bookingsApi';
import type { Booking } from '../../types/booking';
import { usePagedTable } from '../../hooks/usePagedTable';
import { centsToUSD } from '../../utils/currency';
import { formatEventDate } from '../../utils/date';
import BookingStatusTag from '../../components/bookings/BookingStatusTag';
import PageHeader from '../../components/shared/PageHeader';

export default function MyBookingsPage() {
  const { message } = App.useApp();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const fetcher = useCallback(
    (params: { page?: number; pageSize?: number }) =>
      bookingsApi.getMine(params.page, params.pageSize),
    [],
  );

  const { data, total, page, pageSize, loading, setPage, refresh } = usePagedTable<
    Booking,
    { page?: number; pageSize?: number }
  >({ fetcher });

  const handleCancel = async (id: string) => {
    try {
      await bookingsApi.cancel(id);
      message.success('Booking cancelled');
      refresh();
    } catch {
      message.error('Failed to cancel booking');
    }
  };

  const handleShowQr = async (bookingId: string) => {
    setQrLoading(true);
    try {
      const { data: blob } = await bookingsApi.getQrCode(bookingId);
      const url = URL.createObjectURL(blob as Blob);
      setQrUrl(url);
    } catch {
      message.error('Failed to load QR code');
    } finally {
      setQrLoading(false);
    }
  };

  const handleCloseQr = () => {
    if (qrUrl) {
      URL.revokeObjectURL(qrUrl);
      setQrUrl(null);
    }
  };

  const columns: ColumnsType<Booking> = [
    { title: 'Booking #', dataIndex: 'bookingNumber', key: 'bookingNumber', width: 140 },
    { title: 'Event', dataIndex: 'eventTitle', key: 'eventTitle' },
    {
      title: 'Details',
      key: 'details',
      width: 160,
      render: (_, record) => {
        if (record.tableLabel) return `Table ${record.tableLabel}`;
        if (record.seatsReserved) return `${record.seatsReserved} seat${record.seatsReserved !== 1 ? 's' : ''}`;
        return '-';
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => <BookingStatusTag status={status} />,
    },
    {
      title: 'Total',
      dataIndex: 'totalCents',
      key: 'totalCents',
      width: 100,
      render: (cents: number) => centsToUSD(cents),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 200,
      render: (iso: string) => formatEventDate(iso),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space>
          {(record.status === 'Paid' || record.status === 'CheckedIn') && (
            <Button
              size="small"
              icon={<QrcodeOutlined />}
              onClick={() => handleShowQr(record.id)}
              loading={qrLoading}
            >
              QR
            </Button>
          )}
          {record.status === 'Pending' && (
            <Button size="small" danger onClick={() => handleCancel(record.id)}>
              Cancel
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="My Bookings" subtitle="View and manage your event bookings" />
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: setPage,
          showSizeChanger: false,
        }}
      />
      <Modal
        open={qrUrl !== null}
        onCancel={handleCloseQr}
        footer={null}
        title="Booking QR Code"
        centered
      >
        {qrUrl && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Image src={qrUrl} alt="Booking QR Code" width={240} preview={false} />
          </div>
        )}
      </Modal>
    </>
  );
}
