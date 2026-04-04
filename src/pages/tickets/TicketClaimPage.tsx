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
import { ticketsApi } from '../../services/ticketsApi';
import type { TicketClaimInfo } from '../../types/ticket';
import { useAuthStore } from '../../stores/authStore';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { formatEventDate } from '../../utils/date';

export default function TicketClaimPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const token = searchParams.get('token');
  const user = useAuthStore((s) => s.user);
  const { isAuthenticated } = useAuth();

  const [info, setInfo] = useState<TicketClaimInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const claimedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setError('No invite token provided');
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const { data } = await ticketsApi.getClaimInfo(token);
        setInfo(data);
        if (data.alreadyClaimed) setClaimed(true);
      } catch {
        setError('This invite link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token]);

  // Auto-claim when user is authenticated and ticket not yet claimed
  useEffect(() => {
    if (!isAuthenticated || !token || !info || info.alreadyClaimed || claimedRef.current) return;
    if (!user?.hasCompletedOnboarding) {
      navigate(`/onboarding?returnUrl=${encodeURIComponent(`/tickets/claim?token=${token}`)}`, { replace: true });
      return;
    }
    claimedRef.current = true;
    const doClaim = async () => {
      setClaiming(true);
      try {
        await ticketsApi.claim(token);
        setClaimed(true);
        message.success('Ticket claimed successfully!');
      } catch {
        message.error('Failed to claim ticket');
      } finally {
        setClaiming(false);
      }
    };
    void doClaim();
  }, [isAuthenticated, token, info, user, navigate, message]);

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
          {info.inviterName} has sent you a ticket
        </Typography.Text>

        <Card
          size="small"
          style={{ margin: '20px 0', textAlign: 'left', borderRadius: 12, background: 'var(--bg-elevated, #f9fafb)' }}
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
