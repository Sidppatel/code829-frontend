import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, App, Tag, Result } from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  UserOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import { useTicketClaimInfoQuery, useClaimTicketMutation } from '@code829/shared/queries';
import { useAuthStore } from '@code829/shared/stores/authStore';
import { useAuth } from '@code829/shared/hooks/useAuth';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import { formatEventDate } from '@code829/shared/utils/date';

export default function TicketClaimPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const token = searchParams.get('token');
  const user = useAuthStore((s) => s.user);
  const { isAuthenticated } = useAuth();

  const [claimedLocal, setClaimedLocal] = useState(false);
  const claimedRef = useRef(false);

  const claimInfoQuery = useTicketClaimInfoQuery(token ?? undefined);
  const info = claimInfoQuery.data ?? null;
  const loading = !!token && claimInfoQuery.isPending;
  const error = !token
    ? 'No invite token provided'
    : claimInfoQuery.isError ? 'This invite link is invalid or has expired.' : null;

  const claimMutation = useClaimTicketMutation();
  const claiming = claimMutation.isPending;
  const claimed = claimedLocal || !!info?.alreadyClaimed;

  useEffect(() => {
    if (!isAuthenticated || !token || !info || info.alreadyClaimed || claimedRef.current) return;
    if (user && 'hasCompletedOnboarding' in user && !user.hasCompletedOnboarding) {
      navigate(`/onboarding?returnUrl=${encodeURIComponent(`/tickets/claim?token=${token}`)}`, { replace: true });
      return;
    }
    claimedRef.current = true;
    claimMutation.mutateAsync(token)
      .then(() => { setClaimedLocal(true); message.success('Ticket claimed successfully!'); })
      .catch(() => message.error('Failed to claim ticket'));
  }, [isAuthenticated, token, info, user, navigate, message, claimMutation]);

  if (loading || claiming) return <LoadingSpinner />;

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 16px' }}>
        <Result
          status="error"
          title="Invalid Invite"
          subTitle={error}
          extra={<Button type="primary" onClick={() => navigate('/')}>Go Home</Button>}
        />
      </div>
    );
  }

  if (claimed) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 16px' }}>
        <Result
          status="success"
          title="Ticket Claimed!"
          subTitle={`You're all set for ${info?.eventTitle}. View your ticket and QR code on the My Tickets page.`}
          extra={
            <Button type="primary" onClick={() => navigate('/tickets')}>
              View My Tickets
            </Button>
          }
        />
      </div>
    );
  }

  if (!info) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', padding: '24px 16px' }}>
      <Card style={{ width: '100%', maxWidth: 440, borderRadius: 16, textAlign: 'center' }}>
        <GiftOutlined style={{ fontSize: 48, color: 'var(--accent-violet)', marginBottom: 16 }} />
        <Typography.Title level={3} style={{ margin: '0 0 4px' }}>
          You&apos;re Invited!
        </Typography.Title>
        <Typography.Text type="secondary">
          A friend has sent you a ticket
        </Typography.Text>

        <Card
          size="small"
          style={{ margin: '20px 0', textAlign: 'left', borderRadius: 12, background: 'var(--bg-elevated)' }}
          styles={{ body: { padding: 16 } }}
        >
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{info.eventTitle}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span><CalendarOutlined style={{ marginRight: 8 }} />{formatEventDate(info.eventDate)}</span>
            <span><EnvironmentOutlined style={{ marginRight: 8 }} />{info.venueName}</span>
            {info.tableLabel && (
              <span><UserOutlined style={{ marginRight: 8 }} />Table {info.tableLabel} • Seat #{info.seatNumber}</span>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            <Tag>{info.ticketCode}</Tag>
          </div>
        </Card>

        {!isAuthenticated && (
          <Button
            type="primary"
            size="large"
            icon={<LoginOutlined />}
            block
            onClick={() => navigate(`/login?returnUrl=${encodeURIComponent(`/tickets/claim?token=${token}`)}`)}
            style={{ borderRadius: 10, height: 44 }}
          >
            Log In to Claim Your Ticket
          </Button>
        )}
      </Card>
    </div>
  );
}
