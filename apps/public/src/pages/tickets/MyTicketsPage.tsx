import { useState, useEffect } from 'react';
import { Card, Tag, Button, App, Empty, Modal, Image } from 'antd';
import { Helmet } from 'react-helmet-async';
import {
  QrcodeOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { ticketsApi } from '../../services/api';
import type { GuestTicket } from '@code829/shared/types/ticket';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import { formatEventDate } from '@code829/shared/utils/date';

export default function MyTicketsPage() {
  const { message } = App.useApp();
  const [tickets, setTickets] = useState<GuestTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLabel, setQrLabel] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await ticketsApi.getMine();
        setTickets(data);
      } catch {
        message.error('Failed to load tickets');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [message]);

  const handleShowQr = async (ticket: GuestTicket) => {
    try {
      const { data: blob } = await ticketsApi.getMyTicketQr(ticket.id);
      const url = URL.createObjectURL(blob as Blob);
      setQrUrl(url);
      setQrLabel(`Seat #${ticket.seatNumber} — ${ticket.eventTitle}`);
    } catch {
      message.error('Failed to load QR code');
    }
  };

  const handleCloseQr = () => {
    if (qrUrl) URL.revokeObjectURL(qrUrl);
    setQrUrl(null);
    setQrLabel('');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Helmet><title>My Tickets - Code829</title></Helmet>
      <PageHeader title="My Tickets" subtitle="Your event tickets and invitations" />

      {tickets.length === 0 ? (
        <Empty description="No tickets yet" style={{ padding: '48px 0' }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              size="small"
              styles={{ body: { padding: 16 } }}
              style={{ borderRadius: 12 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 15, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ticket.eventTitle}
                </div>
                {ticket.status === 'CheckedIn' ? (
                  <Tag color="green" icon={<CheckCircleOutlined />}>Checked In</Tag>
                ) : (
                  <Tag color="blue" icon={<UserOutlined />}>Seat #{ticket.seatNumber}</Tag>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                <span><CalendarOutlined style={{ marginRight: 6 }} />{formatEventDate(ticket.eventDate)}</span>
                <span><EnvironmentOutlined style={{ marginRight: 6 }} />{ticket.venueName}</span>
                {ticket.tableLabel && <span>Table {ticket.tableLabel} • Seat #{ticket.seatNumber}</span>}
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ticket.ticketCode} • {ticket.bookingNumber}</span>
              </div>

              <Button
                icon={<QrcodeOutlined />}
                onClick={() => handleShowQr(ticket)}
                block
                style={{ borderRadius: 8 }}
              >
                Show QR Code
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={qrUrl !== null}
        onCancel={handleCloseQr}
        footer={null}
        title={qrLabel}
        centered
      >
        {qrUrl && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Image src={qrUrl} alt="Ticket QR Code" width={240} preview={false} />
            <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>
              Show this QR code at the venue for check-in
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
