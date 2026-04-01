import { useState, useCallback } from 'react';
import { Table, Button, App, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { bookingsApi } from '../../services/api';
import type { Booking, BookingItem } from '../../types/booking';
import { usePagedTable } from '../../hooks/usePagedTable';
import { centsToUSD } from '../../utils/currency';
import { formatEventDate } from '../../utils/date';
import BookingStatusTag from '../../components/bookings/BookingStatusTag';
import GuestEditModal from '../../components/bookings/GuestEditModal';
import PageHeader from '../../components/shared/PageHeader';

interface GuestEditState {
  bookingId: string;
  itemId: string;
  guestName?: string;
  guestEmail?: string;
}

export default function MyBookingsPage() {
  const [guestEdit, setGuestEdit] = useState<GuestEditState | null>(null);
  const { message } = App.useApp();

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

  const columns: ColumnsType<Booking> = [
    { title: 'Booking #', dataIndex: 'bookingNumber', key: 'bookingNumber', width: 140 },
    { title: 'Event', dataIndex: 'eventTitle', key: 'eventTitle' },
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
      width: 120,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => message.info(`Booking ${record.bookingNumber}`)} />
          {record.status === 'Pending' && (
            <Button size="small" danger onClick={() => handleCancel(record.id)}>
              Cancel
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const expandedRowRender = (booking: Booking) => {
    const itemColumns: ColumnsType<BookingItem> = [
      { title: 'Ticket', dataIndex: 'ticketTypeName', key: 'ticketTypeName' },
      { title: 'Seat/Table', key: 'seat', render: (_, item) => item.tableLabel ?? item.seatLabel ?? '-' },
      { title: 'Price', dataIndex: 'priceCents', key: 'price', render: (c: number) => centsToUSD(c) },
      { title: 'Guest', key: 'guest', render: (_, item) => item.guestName ?? '-' },
      {
        title: '',
        key: 'editGuest',
        width: 40,
        render: (_, item) => (
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() =>
              setGuestEdit({
                bookingId: booking.id,
                itemId: item.id,
                guestName: item.guestName,
                guestEmail: item.guestEmail,
              })
            }
          />
        ),
      },
    ];

    return (
      <Table
        columns={itemColumns}
        dataSource={booking.items}
        rowKey="id"
        pagination={false}
        size="small"
      />
    );
  };

  return (
    <>
      <PageHeader title="My Bookings" subtitle="View and manage your event bookings" />
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        expandable={{ expandedRowRender }}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: setPage,
          showSizeChanger: false,
        }}
      />
      {guestEdit && (
        <GuestEditModal
          open
          bookingId={guestEdit.bookingId}
          itemId={guestEdit.itemId}
          initialName={guestEdit.guestName}
          initialEmail={guestEdit.guestEmail}
          onClose={() => setGuestEdit(null)}
          onSaved={refresh}
        />
      )}
    </>
  );
}
