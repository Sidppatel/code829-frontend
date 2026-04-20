import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, App, Tag, Modal, Input, Image, Empty, Tooltip } from 'antd';
import { Helmet } from 'react-helmet-async';
import {
  QrcodeOutlined,
  SendOutlined,
  UndoOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MailOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { ticketsApi } from '../../services/api';
import type { PurchaseTicket } from '@code829/shared/types/ticket';
import PagePreamble from '../../components/layout/PagePreamble';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import { formatEventDate } from '@code829/shared/utils/date';
import { createLogger } from '@code829/shared/lib/logger';
import { useAuthStore } from '@code829/shared/stores/authStore';

const log = createLogger('Public/PurchaseTicketsPage');

export default function PurchaseTicketsPage() {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  useAuthStore((s) => s.user?.id);

  const [tickets, setTickets] = useState<PurchaseTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrSeat, setQrSeat] = useState<number | null>(null);
  const [inviteModal, setInviteModal] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [sending, setSending] = useState(false);

  const loadTickets = useCallback(async () => {
    if (!purchaseId) return;
    try {
      const { data } = await ticketsApi.getForBooking(purchaseId);
      setTickets(data);
      log.info('Loaded tickets for booking', { purchaseId, count: data.length });
    } catch (err) {
      log.error('Failed to load tickets', err);
      message.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [purchaseId, message]);

  useEffect(() => {
    Promise.resolve().then(() => loadTickets());
  }, [loadTickets]);

  const handleShowQr = async (ticketId: string, seatNumber: number) => {
    if (!purchaseId) return;
    try {
      const { data: blob } = await ticketsApi.getTicketQr(purchaseId, ticketId);
      const url = URL.createObjectURL(blob as Blob);
      setQrUrl(url);
      setQrSeat(seatNumber);
    } catch (err) {
      log.error('Failed to load ticket QR code', err);
      message.error('Failed to load QR code');
    }
  };

  const handleCloseQr = () => {
    if (qrUrl) URL.revokeObjectURL(qrUrl);
    setQrUrl(null);
    setQrSeat(null);
  };

  const handleInvite = async () => {
    if (!purchaseId || !inviteModal || !inviteEmail.trim()) return;
    setSending(true);
    try {
      await ticketsApi.invite(purchaseId, inviteModal, inviteEmail.trim(), inviteName.trim() || undefined);
      log.info('Ticket invite sent', { purchaseId, ticketId: inviteModal, email: inviteEmail.trim() });
      message.success(`Invite sent to ${inviteEmail}`);
      setInviteModal(null);
      setInviteEmail('');
      setInviteName('');
      void loadTickets();
    } catch (err) {
      log.error('Failed to send ticket invite', err);
      message.error('Failed to send invite');
    } finally {
      setSending(false);
    }
  };

  const handleClaimSelf = async (ticketId: string) => {
    if (!purchaseId) return;
    try {
      await ticketsApi.claimSelf(purchaseId, ticketId);
      log.info('Ticket self-claimed', { purchaseId, ticketId });
      message.success('Ticket claimed — it now appears in your My Tickets');
      void loadTickets();
    } catch (err) {
      log.error('Failed to claim ticket for self', err);
      message.error('Failed to claim ticket');
    }
  };

  const handleRevoke = (ticketId: string, status: string) => {
    if (!purchaseId) return;
    const content = status === 'Claimed'
      ? 'Are you sure? The guest will lose their ticket and you\'ll be able to reassign it.'
      : 'Are you sure? The invite link will stop working and the guest won\'t be able to claim.';
    Modal.confirm({
      title: 'Revoke Ticket',
      content,
      okText: 'Revoke',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await ticketsApi.revoke(purchaseId, ticketId);
          log.info('Ticket invite revoked', { purchaseId, ticketId });
          message.success('Invite revoked');
          void loadTickets();
        } catch (err) {
          log.error('Failed to revoke ticket invite', err);
          message.error('Failed to revoke invite');
        }
      },
    });
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
    <div>
      <Helmet><title>Manage tickets — Code829</title></Helmet>
      <PagePreamble
        kicker="Your evening"
        title="Manage tickets"
        subtitle={first ? `${first.eventTitle} · ${first.purchaseNumber}` : 'Purchase tickets'}
        rightSlot={
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/purchases')}
            style={{ color: 'var(--text-secondary)', fontWeight: 500 }}
          >
            Back
          </Button>
        }
      />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 32px 64px' }}>

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
                    icon={<UserOutlined />}
                    onClick={() => handleClaimSelf(ticket.id)}
                  >
                    Claim for Myself
                  </Button>
                )}

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
                    {ticket.status === 'Invited' ? 'Resend' : 'Send to Guest'}
                  </Button>
                )}

                {(ticket.status === 'Invited' || ticket.status === 'Claimed') && (
                  <Tooltip title="Revoke and unassign">
                    <Button
                      size="small"
                      danger
                      icon={<UndoOutlined />}
                      onClick={() => handleRevoke(ticket.id, ticket.status)}
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
    </div>
  );
}
