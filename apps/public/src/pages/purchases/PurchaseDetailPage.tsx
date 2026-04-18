import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, App, Tag, Divider, Image, Modal, Space } from 'antd';
import { Helmet } from 'react-helmet-async';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  QrcodeOutlined,
  SendOutlined,
  TagOutlined,
  CreditCardOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
  NumberOutlined,
  TeamOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { bookingsApi } from '../../services/api';
import type { Purchase } from '@code829/shared/types/purchase';
import { centsToUSD } from '@code829/shared/utils/currency';
import { formatEventDate } from '@code829/shared/utils/date';
import PurchaseStatusTag from '../../components/purchases/PurchaseStatusTag';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import PagePreamble from '../../components/layout/PagePreamble';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Public/PurchaseDetailPage');

export default function PurchaseDetailPage() {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [booking, setBooking] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!purchaseId) return;
    const load = async () => {
      try {
        const { data } = await bookingsApi.getById(purchaseId);
        setBooking(data);
        log.info('Loaded purchase details', { purchaseId, bookingNumber: data.bookingNumber });
      } catch (err) {
        log.error('Failed to load purchase details', err);
        message.error('Failed to load purchase details');
        navigate('/bookings', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [purchaseId, message, navigate]);

  const handleShowQr = async () => {
    if (!purchaseId) return;
    try {
      const { data: blob } = await bookingsApi.getQrCode(purchaseId);
      setQrUrl(URL.createObjectURL(blob as Blob));
    } catch (err) {
      log.error('Failed to load QR code', err);
      message.error('Failed to load QR code');
    }
  };

  const handleCancel = () => {
    if (!purchaseId) return;
    Modal.confirm({
      title: 'Cancel Purchase',
      content: 'Are you sure you want to cancel this purchase? This action cannot be undone.',
      okText: 'Cancel Purchase',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await bookingsApi.cancel(purchaseId);
          log.info('Purchase cancelled', { purchaseId });
          message.success('Purchase cancelled');
          const { data } = await bookingsApi.getById(purchaseId);
          setBooking(data);
        } catch (err) {
          log.error('Failed to cancel purchase', err);
          message.error('Failed to cancel purchase');
        }
      },
    });
  };

  if (loading) return <LoadingSpinner />;
  if (!booking) return null;

  const isPaid = booking.status === 'Paid' || booking.status === 'CheckedIn';
  const paymentStatusColor = (status: string) => {
    switch (status) {
      case 'Succeeded': return 'success';
      case 'RequiresConfirmation': return 'processing';
      case 'Refunded': return 'orange';
      case 'Failed': return 'error';
      default: return 'default';
    }
  };

  const sectionTitle = (text: string) => (
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
      {text}
    </div>
  );

  const infoRow = (icon: React.ReactNode, label: string, value: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 16, marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );

  const priceRow = (label: string, cents: number, bold?: boolean) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: bold ? 15 : 14, fontWeight: bold ? 700 : 400, color: bold ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
      <span>{label}</span>
      <span>{centsToUSD(cents)}</span>
    </div>
  );

  return (
    <div>
      <Helmet><title>Purchase details — Code829</title></Helmet>
      <PagePreamble
        kicker={`Purchase #${booking.bookingNumber}`}
        title={booking.eventTitle}
        subtitle={formatEventDate(booking.eventDate)}
        rightSlot={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PurchaseStatusTag status={booking.status} />
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/bookings')}
              style={{ color: 'var(--text-secondary)', fontWeight: 500 }}
            >
              Back
            </Button>
          </div>
        }
      />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 32px 64px' }}>

      {/* Event Banner */}
      {booking.eventImagePath && (
        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, maxHeight: 180 }}>
          <img
            src={booking.eventImagePath}
            alt={booking.eventTitle}
            loading="lazy"
            style={{ width: '100%', height: 180, objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Event Info */}
      <Card size="small" style={{ marginBottom: 12, borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
        {sectionTitle('Event')}
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{booking.eventTitle}</div>
        {infoRow(<CalendarOutlined />, 'Date & Time', (
          <>
            {formatEventDate(booking.eventDate)}
            {booking.eventEndDate && (
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> — {formatEventDate(booking.eventEndDate)}</span>
            )}
          </>
        ))}
        {booking.venueName && infoRow(<EnvironmentOutlined />, 'Venue', (
          <>
            {booking.venueName}
            {booking.venueAddress && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginTop: 2 }}>{booking.venueAddress}</div>
            )}
          </>
        ))}
        {booking.eventCategory && infoRow(<AppstoreOutlined />, 'Category', <Tag>{booking.eventCategory}</Tag>)}
      </Card>

      {/* Purchase Details */}
      <Card size="small" style={{ marginBottom: 12, borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
        {sectionTitle('Purchase Info')}
        {infoRow(<NumberOutlined />, 'Purchase Number', booking.bookingNumber)}
        {infoRow(<ClockCircleOutlined />, 'Booked On', formatEventDate(booking.createdAt))}
        {booking.tableLabel && infoRow(<TagOutlined />, 'Table', `Table ${booking.tableLabel}`)}
        {booking.seatsReserved && infoRow(<TeamOutlined />, 'Seats Reserved', `${booking.seatsReserved} seat${booking.seatsReserved !== 1 ? 's' : ''}`)}
        {booking.ticketCount > 0 && infoRow(<SendOutlined />, 'Tickets', `${booking.ticketCount} ticket${booking.ticketCount !== 1 ? 's' : ''}`)}
      </Card>

      {/* Price — mirrors the checkout breakdown so the receipt shape is familiar.
          booking.totalCents is pre-tax (admin + platform fee). The charged total comes from the
          StripeTransaction once the webhook has enriched it; amountCents is the PaymentIntent
          amount and is already tax-inclusive, so it works as a fallback before enrichment. */}
      {(() => {
        const subtotalCents = booking.totalCents;
        const chargedCents = booking.transaction?.totalChargedCents
          ?? booking.transaction?.amountCents
          ?? subtotalCents;
        const taxCents = booking.transaction?.taxAmountCents
          ?? Math.max(0, chargedCents - subtotalCents);
        return (
          <Card size="small" style={{ marginBottom: 12, borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
            {sectionTitle('Price')}
            {priceRow('Subtotal', subtotalCents)}
            {taxCents > 0 && priceRow('Tax', taxCents)}
            <Divider style={{ margin: '8px 0' }} />
            {priceRow('Total', chargedCents, true)}
          </Card>
        );
      })()}

      {/* Payment Info */}
      {booking.transaction && (
        <Card size="small" style={{ marginBottom: 12, borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
          {sectionTitle('Payment')}
          {infoRow(<CreditCardOutlined />, 'Payment Status', (
            <Tag color={paymentStatusColor(booking.transaction.status)}>{booking.transaction.status}</Tag>
          ))}
          {booking.transaction.paidAt && infoRow(<CheckCircleOutlined />, 'Paid At', formatEventDate(booking.transaction.paidAt))}
          {booking.transaction.refundedAt && infoRow(<CloseCircleOutlined />, 'Refunded At', formatEventDate(booking.transaction.refundedAt))}
        </Card>
      )}

      {/* Actions */}
      <Card size="small" style={{ marginBottom: 24, borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
        <Space wrap>
          {isPaid && (
            <>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => navigate(`/bookings/${booking.id}/tickets`)}
              >
                Manage Tickets
              </Button>
              <Button
                icon={<QrcodeOutlined />}
                onClick={handleShowQr}
              >
                Show QR Code
              </Button>
            </>
          )}
          {booking.status === 'Pending' && (
            <Button danger onClick={handleCancel}>
              Cancel Purchase
            </Button>
          )}
          <Button onClick={() => navigate('/purchases')}>
            Back to Purchases
          </Button>
        </Space>
      </Card>

      {/* QR Modal */}
      <Modal
        open={qrUrl !== null}
        onCancel={() => {
          if (qrUrl) URL.revokeObjectURL(qrUrl);
          setQrUrl(null);
        }}
        footer={null}
        title="Purchase QR Code"
        centered
      >
        {qrUrl && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Image src={qrUrl} alt="Purchase QR Code" width={240} preview={false} />
            <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>
              Show this QR code at the venue for check-in
            </div>
          </div>
        )}
      </Modal>
      </div>
    </div>
  );
}
