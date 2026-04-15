import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, App, Tag, Divider, Image, Modal, Space } from 'antd';
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
import type { Booking } from '@code829/shared/types/booking';
import { centsToUSD } from '@code829/shared/utils/currency';
import { formatEventDate } from '@code829/shared/utils/date';
import BookingStatusTag from '../../components/bookings/BookingStatusTag';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    const load = async () => {
      try {
        const { data } = await bookingsApi.getById(bookingId);
        setBooking(data);
      } catch {
        message.error('Failed to load booking details');
        navigate('/bookings', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [bookingId, message, navigate]);

  const handleShowQr = async () => {
    if (!bookingId) return;
    try {
      const { data: blob } = await bookingsApi.getQrCode(bookingId);
      setQrUrl(URL.createObjectURL(blob as Blob));
    } catch {
      message.error('Failed to load QR code');
    }
  };

  const handleCancel = async () => {
    if (!bookingId) return;
    try {
      await bookingsApi.cancel(bookingId);
      message.success('Booking cancelled');
      const { data } = await bookingsApi.getById(bookingId);
      setBooking(data);
    } catch {
      message.error('Failed to cancel booking');
    }
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
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/bookings')}
          style={{ padding: '4px 8px' }}
        />
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Booking Details</h2>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>#{booking.bookingNumber}</div>
        </div>
        <BookingStatusTag status={booking.status} />
      </div>

      {/* Event Banner */}
      {booking.eventImagePath && (
        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, maxHeight: 180 }}>
          <img
            src={booking.eventImagePath}
            alt={booking.eventTitle}
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

      {/* Booking Details */}
      <Card size="small" style={{ marginBottom: 12, borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
        {sectionTitle('Booking Info')}
        {infoRow(<NumberOutlined />, 'Booking Number', booking.bookingNumber)}
        {infoRow(<ClockCircleOutlined />, 'Booked On', formatEventDate(booking.createdAt))}
        {booking.tableLabel && infoRow(<TagOutlined />, 'Table', `Table ${booking.tableLabel}`)}
        {booking.seatsReserved && infoRow(<TeamOutlined />, 'Seats Reserved', `${booking.seatsReserved} seat${booking.seatsReserved !== 1 ? 's' : ''}`)}
        {booking.ticketCount > 0 && infoRow(<SendOutlined />, 'Tickets', `${booking.ticketCount} ticket${booking.ticketCount !== 1 ? 's' : ''}`)}
      </Card>

      {/* Price Breakdown */}
      <Card size="small" style={{ marginBottom: 12, borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
        {sectionTitle('Price Breakdown')}
        {priceRow('Subtotal', booking.subtotalCents)}
        {priceRow('Service Fee', booking.feeCents)}
        <Divider style={{ margin: '8px 0' }} />
        {priceRow('Total', booking.totalCents, true)}
      </Card>

      {/* Payment Info */}
      {booking.payment && (
        <Card size="small" style={{ marginBottom: 12, borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
          {sectionTitle('Payment')}
          {infoRow(<CreditCardOutlined />, 'Payment Status', (
            <Tag color={paymentStatusColor(booking.payment.status)}>{booking.payment.status}</Tag>
          ))}
          {infoRow(<TagOutlined />, 'Amount Charged', centsToUSD(booking.payment.amountCents))}
          {booking.payment.paidAt && infoRow(<CheckCircleOutlined />, 'Paid At', formatEventDate(booking.payment.paidAt))}
          {booking.payment.refundedAt && infoRow(<CloseCircleOutlined />, 'Refunded At', formatEventDate(booking.payment.refundedAt))}
          {booking.payment.paymentIntentId && infoRow(<NumberOutlined />, 'Transaction ID', (
            <span style={{ fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>{booking.payment.paymentIntentId}</span>
          ))}
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
              Cancel Booking
            </Button>
          )}
          <Button onClick={() => navigate('/bookings')}>
            Back to Bookings
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
        title="Booking QR Code"
        centered
      >
        {qrUrl && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Image src={qrUrl} alt="Booking QR Code" width={240} preview={false} />
            <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>
              Show this QR code at the venue for check-in
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
