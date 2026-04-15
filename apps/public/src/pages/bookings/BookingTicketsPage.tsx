import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, App, Tag, Modal, Input, Image, Empty, Tooltip } from 'antd';
import {
  QrcodeOutlined,
  SendOutlined,
  UndoOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { ticketsApi } from '../../services/api';
import type { BookingTicket } from '@code829/shared/types/ticket';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import { formatEventDate } from '@code829/shared/utils/date';

export default function BookingTicketsPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [tickets, setTickets] = useState<BookingTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrSeat, setQrSeat] = useState<number | null>(null);
  const [inviteModal, setInviteModal] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [sending, setSending] = useState(false);

  const loadTickets = useCallback(async () => {
    if (!bookingId) return;
    try {
      const { data } = await ticketsApi.getForBooking(bookingId);
      setTickets(data);
    } catch {
      message.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [bookingId, message]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const handleShowQr = async (ticketId: string, seatNumber: number) => {
    if (!bookingId) return;
    try {
      const { data: blob } = await ticketsApi.getTicketQr(bookingId, ticketId);
      const url = URL.createObjectURL(blob as Blob);
      setQrUrl(url);
      setQrSeat(seatNumber);
    } catch {
      message.error('Failed to load QR code');
    }
  };

  const handleCloseQr = () => {
    if (qrUrl) URL.revokeObjectURL(qrUrl);
    setQrUrl(null);
    setQrSeat(null);
  };

  const handleInvite = async () => {
    if (!bookingId || !inviteModal || !inviteEmail.trim()) return;
    setSending(true);
    try {
      await ticketsApi.invite(bookingId, inviteModal, inviteEmail.trim(), inviteName.trim() || undefined);
      message.success(`Invite sent to ${inviteEmail}`);
      setInviteModal(null);
      setInviteEmail('');
      setInviteName('');
      void loadTickets();
    } catch {
      message.error('Failed to send invite');
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (ticketId: string) => {
    if (!bookingId) return;
    try {
      await ticketsApi.revoke(bookingId, ticketId);
      message.success('Invite revoked');
      void loadTickets();
    } catch {
      message.error('Failed to revoke invite');
    }
  };

  const statusTag = (status: string) => {
    switch (status) {
      case 'Unassigned': return <Tag icon={<ClockCircleOutlined />}>Unassigned</Tag>;
      case 'Invited': return <Tag color="processing" icon={<MailOutlined />}>Invited</Tag>;
      case 'Claimed': return <Tag color="success" icon={<UserOutlined />}>Claimed</Tag>;
      case 'CheckedIn': return <Tag color="green" icon={<CheckCircleOutlined />}>Checked In</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  if (loading) return <LoadingSpinner />;

  const first = tickets[0];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <PageHeader
        title="Manage Tickets"
        subtitle={first ? `${first.eventTitle} • ${first.bookingNumber}` : 'Booking tickets'}
        onBack={() => navigate('/bookings')}
      />

      {first && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>
            <span>{formatEventDate(first.eventDate)}</span>
            <span>{first.venueName}</span>
            {first.tableLabel && <span>Table {first.tableLabel}</span>}
            <span>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</span>
          </div>
        </Card>
      )}

      {tickets.length === 0 ? (
        <Empty description="No tickets found for this booking" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              size="small"
              styles={{ body: { padding: 16 } }}
              style={{ borderRadius: 12 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Seat #{ticket.seatNumber}</div>
                {statusTag(ticket.status)}
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                {ticket.ticketCode}
              </div>

              {ticket.guestName && (
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                  <UserOutlined style={{ marginRight: 6 }} />
                  {ticket.guestName}
                </div>
              )}
              {ticket.invitedEmail && !ticket.guestName && (
                <div style={{ fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  <MailOutlined style={{ marginRight: 6 }} />
                  {ticket.invitedEmail}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  icon={<QrcodeOutlined />}
                  onClick={() => handleShowQr(ticket.id, ticket.seatNumber)}
                >
                  QR
                </Button>

                {(ticket.status === 'Unassigned' || ticket.status === 'Invited') && (
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    icon={<SendOutlined />}
                    onClick={() => {
                      setInviteModal(ticket.id);
                      setInviteEmail(ticket.invitedEmail ?? '');
                    }}
                  >
                    {ticket.status === 'Invited' ? 'Resend' : 'Invite'}
                  </Button>
                )}

                {(ticket.status === 'Invited' || ticket.status === 'Claimed') && ticket.seatNumber !== 1 && (
                  <Tooltip title="Revoke invite and unassign">
                    <Button
                      size="small"
                      danger
                      icon={<UndoOutlined />}
                      onClick={() => handleRevoke(ticket.id)}
                    >
                      Revoke
                    </Button>
                  </Tooltip>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* QR Modal */}
      <Modal
        open={qrUrl !== null}
        onCancel={handleCloseQr}
        footer={null}
        title={`Ticket QR — Seat #${qrSeat}`}
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

      {/* Invite Modal */}
      <Modal
        open={inviteModal !== null}
        onCancel={() => { setInviteModal(null); setInviteEmail(''); setInviteName(''); }}
        onOk={handleInvite}
        confirmLoading={sending}
        okText="Send Invite"
        title="Send Ticket Invite"
        okButtonProps={{ disabled: !inviteEmail.trim() }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Email *</label>
            <Input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="guest@example.com"
              type="email"
              prefix={<MailOutlined />}
              style={{ marginTop: 4 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Guest Name (optional)</label>
            <Input
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="John Doe"
              prefix={<UserOutlined />}
              style={{ marginTop: 4 }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
