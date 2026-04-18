import { useCallback } from 'react';
import { Alert, Button, Card, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  QrcodeOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { bookingsApi, ticketsApi } from '../../services/api';
import type { Purchase } from '@code829/shared/types/purchase';
import type { GuestTicket } from '@code829/shared/types/ticket';
import { usePagedTable } from '@code829/shared/hooks/usePagedTable';
import {
  useAsyncAction,
  useConfirm,
  useGuestTickets,
  usePaymentIntentConfirmation,
  useQrCode,
} from '@code829/shared/hooks';
import { centsToUSD } from '@code829/shared/utils/currency';
import { formatEventDate } from '@code829/shared/utils/date';
import PurchaseStatusTag from '../../components/purchases/PurchaseStatusTag';
import PagePreamble from '../../components/layout/PagePreamble';
import {
  DataTableSection,
  FilterBar,
  PageShell,
  QrModal,
} from '@code829/shared/components/ui';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Public/MyPurchasesPage');

type BookingFilters = Record<string, unknown> & {
  search?: string;
};

function bookingDetails(record: Purchase): string {
  if (record.tableLabel) return `Table ${record.tableLabel}`;
  if (record.seatsReserved) return `${record.seatsReserved} seat${record.seatsReserved !== 1 ? 's' : ''}`;
  return '-';
}

export default function MyPurchasesPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();

  const fetcher = useCallback(
    (params: BookingFilters & { page?: number; pageSize?: number }) =>
      bookingsApi.getMine(params.page, params.pageSize, params.search),
    [],
  );
  const paged = usePagedTable<Purchase, BookingFilters>({ fetcher });

  usePaymentIntentConfirmation({ onConfirmed: paged.refresh });
  const guestTickets = useGuestTickets();

  const bookingQr = useQrCode();
  const guestQr = useQrCode();

  const cancel = useAsyncAction(
    (id: string) => bookingsApi.cancel(id),
    {
      successMessage: 'Purchase cancelled',
      onSuccess: () => {
        log.info('Purchase cancelled');
        paged.refresh();
      },
    },
  );

  const columns: ColumnsType<Purchase> = [
    {
      title: 'Purchase #',
      dataIndex: 'bookingNumber',
      key: 'bookingNumber',
      width: 140,
      render: (num: string, record) => (
        <a onClick={() => navigate(`/bookings/${record.id}`)} style={{ fontWeight: 600 }}>
          {num}
        </a>
      ),
    },
    {
      title: 'Event',
      dataIndex: 'eventTitle',
      key: 'eventTitle',
      render: (title: string, record) => <a onClick={() => navigate(`/bookings/${record.id}`)}>{title}</a>,
    },
    { title: 'Details', key: 'details', width: 160, render: (_: unknown, r: Purchase) => bookingDetails(r) },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => <PurchaseStatusTag status={status} />,
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
      width: 160,
      render: (_, record) => (
        <Space>
          {(record.status === 'Paid' || record.status === 'CheckedIn') && (
            <>
              <Button
                size="small"
                icon={<SendOutlined />}
                onClick={() => navigate(`/bookings/${record.id}/tickets`)}
              >
                Tickets
              </Button>
              <Button
                size="small"
                icon={<QrcodeOutlined />}
                loading={bookingQr.loading}
                onClick={() => bookingQr.show(() => bookingsApi.getQrCode(record.id).then((r) => r.data as Blob))}
              >
                QR
              </Button>
            </>
          )}
          {record.status === 'Pending' && (
            <Button
              size="small"
              danger
              onClick={() =>
                confirm({
                  title: 'Cancel Purchase',
                  description: 'Are you sure you want to cancel this purchase? This action cannot be undone.',
                  tone: 'danger',
                  confirmLabel: 'Cancel Purchase',
                  onConfirm: () => cancel.run(record.id),
                })
              }
            >
              Cancel
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageShell
      documentTitle="My Purchases - Code829"
      preamble={
        <PagePreamble
          kicker="Your evenings"
          title="My purchases"
          subtitle="Review, manage, and share tickets for every reservation you've made."
        />
      }
    >
      <FilterBar
        search={{
          placeholder: 'Search by event name, purchase # or status...',
          onChange: (v) => paged.setFilters({ search: v }),
          width: 480,
        }}
      />

      <DataTableSection<Purchase>
        data={paged.data}
        total={paged.total}
        page={paged.page}
        pageSize={paged.pageSize}
        loading={paged.loading}
        onPageChange={paged.onPageChange}
        rowKey="id"
        showSizeChanger={false}
        columns={columns}
        mobileCard={(booking) => (
          <Card
            key={booking.id}
            size="small"
            hoverable
            onClick={() => navigate(`/bookings/${booking.id}`)}
            style={{ marginBottom: 0, cursor: 'pointer' }}
            styles={{ body: { padding: 16 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    marginBottom: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {booking.eventTitle}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>#{booking.bookingNumber}</div>
              </div>
              <PurchaseStatusTag status={booking.status} />
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px 16px',
                fontSize: 13,
                color: 'var(--text-secondary)',
                marginBottom: 12,
              }}
            >
              <span>
                <CalendarOutlined style={{ marginRight: 4 }} />
                {formatEventDate(booking.createdAt)}
              </span>
              <span>{bookingDetails(booking)}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{centsToUSD(booking.totalCents)}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
              {(booking.status === 'Paid' || booking.status === 'CheckedIn') && (
                <>
                  <Button
                    size="small"
                    icon={<SendOutlined />}
                    onClick={() => navigate(`/bookings/${booking.id}/tickets`)}
                  >
                    Manage Tickets
                  </Button>
                  <Button
                    size="small"
                    icon={<QrcodeOutlined />}
                    loading={bookingQr.loading}
                    onClick={() => bookingQr.show(() => bookingsApi.getQrCode(booking.id).then((r) => r.data as Blob))}
                  >
                    QR Code
                  </Button>
                </>
              )}
              {booking.status === 'Pending' && (
                <Button
                  size="small"
                  danger
                  onClick={() =>
                    confirm({
                      title: 'Cancel Purchase',
                      description: 'Cancel this purchase? This action cannot be undone.',
                      tone: 'danger',
                      confirmLabel: 'Cancel Purchase',
                      onConfirm: () => cancel.run(booking.id),
                    })
                  }
                >
                  Cancel
                </Button>
              )}
            </div>
          </Card>
        )}
        empty={{ title: 'No purchases yet', description: 'Your reservations will appear here.' }}
      />

      {guestTickets.error && (
        <Alert
          style={{ marginTop: 24 }}
          type="warning"
          showIcon
          message="Some guest tickets could not be loaded"
          description="Invited tickets may not appear in this list. Refresh the page to try again."
        />
      )}

      {guestTickets.tickets.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <GiftOutlined style={{ fontSize: 18, color: 'var(--accent-violet)' }} />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Guest Tickets</h3>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            {guestTickets.tickets.map((ticket: GuestTicket) => (
              <Card key={ticket.id} size="small" style={{ borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{ticket.eventTitle}</div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    marginBottom: 12,
                  }}
                >
                  <span>
                    <CalendarOutlined style={{ marginRight: 6 }} />
                    {formatEventDate(ticket.eventDate)}
                  </span>
                  <span>
                    <EnvironmentOutlined style={{ marginRight: 6 }} />
                    {ticket.venueName}
                  </span>
                  <span>
                    Seat #{ticket.seatNumber}
                    {ticket.tableLabel ? ` • Table ${ticket.tableLabel}` : ''}
                  </span>
                </div>
                <Button
                  size="small"
                  icon={<QrcodeOutlined />}
                  onClick={() => guestQr.show(() => ticketsApi.getMyTicketQr(ticket.id).then((r) => r.data as Blob))}
                >
                  QR Code
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <QrModal
        open={bookingQr.isOpen}
        onClose={bookingQr.hide}
        qrUrl={bookingQr.url}
        loading={bookingQr.loading}
        title="Purchase QR Code"
        downloadFileName="booking-qr.png"
      />
      <QrModal
        open={guestQr.isOpen}
        onClose={guestQr.hide}
        qrUrl={guestQr.url}
        loading={guestQr.loading}
        title="Ticket QR"
        caption="Show this QR code at the venue for check-in"
        downloadFileName="ticket-qr.png"
      />
    </PageShell>
  );
}
