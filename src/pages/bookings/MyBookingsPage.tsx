import { useState, useCallback } from 'react';
import { Table, Button, App, Space, Modal, Image, Card, Empty, Pagination, Skeleton } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { QrcodeOutlined, CalendarOutlined } from '@ant-design/icons';
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

  const getDetails = (record: Booking): string => {
    if (record.tableLabel) return `Table ${record.tableLabel}`;
    if (record.seatsReserved) return `${record.seatsReserved} seat${record.seatsReserved !== 1 ? 's' : ''}`;
    return '-';
  };

  // ── Desktop Table ──
  const columns: ColumnsType<Booking> = [
    { title: 'Booking #', dataIndex: 'bookingNumber', key: 'bookingNumber', width: 140 },
    { title: 'Event', dataIndex: 'eventTitle', key: 'eventTitle' },
    {
      title: 'Details',
      key: 'details',
      width: 160,
      render: (_, record) => getDetails(record),
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

  // ── Mobile Card ──
  const renderBookingCard = (booking: Booking) => (
    <Card
      key={booking.id}
      size="small"
      style={{ marginBottom: 12 }}
      styles={{ body: { padding: 16 } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {booking.eventTitle}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            #{booking.bookingNumber}
          </div>
        </div>
        <BookingStatusTag status={booking.status} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
        <span><CalendarOutlined style={{ marginRight: 4 }} />{formatEventDate(booking.createdAt)}</span>
        <span>{getDetails(booking)}</span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{centsToUSD(booking.totalCents)}</span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {(booking.status === 'Paid' || booking.status === 'CheckedIn') && (
          <Button
            size="small"
            icon={<QrcodeOutlined />}
            onClick={() => handleShowQr(booking.id)}
            loading={qrLoading}
          >
            QR Code
          </Button>
        )}
        {booking.status === 'Pending' && (
          <Button size="small" danger onClick={() => handleCancel(booking.id)}>
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );

  // ── Mobile loading skeleton ──
  const renderMobileSkeleton = () => (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i} size="small" style={{ marginBottom: 12 }}>
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>
      ))}
    </>
  );

  return (
    <>
      <PageHeader title="My Bookings" subtitle="View and manage your event bookings" />

      {/* Desktop: Table */}
      <div className="desktop-only-block">
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
      </div>

      {/* Mobile: Cards */}
      <div className="mobile-only-block">
        {loading ? (
          renderMobileSkeleton()
        ) : data.length === 0 ? (
          <Empty description="No bookings yet" style={{ padding: '48px 0' }} />
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
