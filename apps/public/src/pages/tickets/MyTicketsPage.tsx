import { Card, Tag, Button, Empty } from 'antd';
import {
  QrcodeOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { ticketsApi } from '../../services/api';
import type { GuestTicket } from '@code829/shared/types/ticket';
import { formatEventDate } from '@code829/shared/utils/date';
import { PageShell, QrModal } from '@code829/shared/components/ui';
import PagePreamble from '../../components/layout/PagePreamble';
import { useAsyncResource, useQrCode } from '@code829/shared/hooks';

export default function MyTicketsPage() {
  const { data: tickets, loading, error } = useAsyncResource<GuestTicket[]>(
    () => ticketsApi.getMine().then(r => r.data),
    []
  );

  const qr = useQrCode();

  const showQr = (ticket: GuestTicket) => {
    qr.show(() => ticketsApi.getMyTicketQr(ticket.id).then(r => r.data as Blob));
  };

  return (
    <PageShell
      documentTitle="My Entries — Code829"
      loading={loading}
      preamble={
        <PagePreamble
          kicker="Admissions"
          title="My entries"
          subtitle="Every event ticket and invitation, in one place."
        />
      }
    >
      {error && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: 'var(--status-danger)' }}>Failed to load tickets. Please try again.</p>
        </div>
      )}

      {!loading && !error && (!tickets || tickets.length === 0) ? (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="You don't have any tickets yet." 
          style={{ padding: '64px 0', background: 'var(--bg-soft)', borderRadius: 24 }} 
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {tickets?.map((ticket) => (
            <Card
              key={ticket.id}
              size="small"
              styles={{ body: { padding: 20 } }}
              style={{ borderRadius: 16 }}
              hoverable
              className="c829-card-hover"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: 700, 
                    fontSize: 16, 
                    marginBottom: 2,
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                    fontFamily: 'var(--font-display)' 
                  }}>
                    {ticket.eventTitle}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 0.5 }}>
                    #{ticket.purchaseNumber}
                  </div>
                </div>
                {ticket.status === 'CheckedIn' ? (
                  <Tag color="green" icon={<CheckCircleOutlined />} style={{ borderRadius: 6 }}>In</Tag>
                ) : (
                  <Tag color="blue" icon={<UserOutlined />} style={{ borderRadius: 6 }}>Entry</Tag>
                )}
              </div>

              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 6, 
                fontSize: 13, 
                color: 'var(--text-secondary)', 
                marginBottom: 20 
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CalendarOutlined style={{ color: 'var(--primary)', fontSize: 14 }} />
                  {formatEventDate(ticket.eventDate)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <EnvironmentOutlined style={{ color: 'var(--primary)', fontSize: 14 }} />
                  {ticket.venueName}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserOutlined style={{ color: 'var(--primary)', fontSize: 14 }} />
                  Seat #{ticket.seatNumber}
                  {ticket.tableLabel ? ` • Table ${ticket.tableLabel}` : ''}
                </span>
              </div>

              <Button
                type="primary"
                icon={<QrcodeOutlined />}
                onClick={() => showQr(ticket)}
                block
                loading={qr.loading}
                style={{ 
                  borderRadius: 10, 
                  height: 40, 
                  fontWeight: 600,
                  background: 'var(--gradient-brand)',
                  border: 'none'
                }}
              >
                Show QR Code
              </Button>
            </Card>
          ))}
        </div>
      )}

      <QrModal
        open={qr.isOpen}
        onClose={qr.hide}
        qrUrl={qr.url}
        loading={qr.loading}
        title="Ticket QR Code"
        caption="Show this code at the venue for check-in"
        downloadFileName="entry-ticket-qr.png"
      />
    </PageShell>
  );
}

