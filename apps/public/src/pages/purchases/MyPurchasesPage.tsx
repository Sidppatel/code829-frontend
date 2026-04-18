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
import { purchasesApi, ticketsApi } from '../../services/api';
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
      purchasesApi.getMine(params.page, params.pageSize, params.search),
    [],
  );
  const paged = usePagedTable<Purchase, BookingFilters>({ fetcher });

  usePaymentIntentConfirmation({ onConfirmed: paged.refresh });
  const guestTickets = useGuestTickets();

  const bookingQr = useQrCode();
  const guestQr = useQrCode();

  const cancel = useAsyncAction(
    (id: string) => purchasesApi.cancel(id),
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
      dataIndex: 'purchaseNumber',
      key: 'purchaseNumber',
      width: 140,
      render: (num: string, record) => (
        <a onClick={() => navigate(`/purchases/${record.id}`)} style={{ fontWeight: 600 }}>
          {num}
        </a>
      ),
    },
    {
      title: 'Event',
      dataIndex: 'eventTitle',
      key: 'eventTitle',
      render: (title: string, record) => <a onClick={() => navigate(`/purchases/${record.id}`)}>{title}</a>,
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
                onClick={() => navigate(`/purchases/${record.id}/tickets`)}
              >
                Tickets
              </Button>
              <Button
                size="small"
                icon={<QrcodeOutlined />}
                loading={bookingQr.loading}
                onClick={() => bookingQr.show(() => purchasesApi.getQrCode(record.id).then((r) => r.data as Blob))}
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
            onClick={() => navigate(`/purchases/${booking.id}`)}
            style={{ marginBottom: 0, cursor: 'pointer' }}
            styles={{ body: { padding: 20 } }}
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
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>#{booking.purchaseNumber}</div>
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
                    onClick={() => navigate(`/purchases/${booking.id}/tickets`)}
                  >
                    Manage Tickets
                  </Button>
                  <Button
                    size="small"
                    icon={<QrcodeOutlined />}
                    loading={bookingQr.loading}
                    onClick={() => bookingQr.show(() => purchasesApi.getQrCode(booking.id).then((r) => r.data as Blob))}
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
        <div style={{ marginTop: 40, textAlign: 'center', padding: '32px 20px', background: 'var(--bg-soft)', borderRadius: 24, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <GiftOutlined style={{ fontSize: 24, color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>You have {guestTickets.tickets.length} guest tickets</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>View and manage entries shared with you by others.</p>
            <Button 
              type="primary" 
              onClick={() => navigate('/guest-tickets')}
              style={{ marginTop: 8, borderRadius: 12, height: 42, padding: '0 24px', fontWeight: 600 }}
            >
              View Guest Tickets
            </Button>
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
