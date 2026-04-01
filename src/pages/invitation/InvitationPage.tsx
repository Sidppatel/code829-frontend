import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Result, Button, Descriptions } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
import { bookingsApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { centsToUSD } from '../../utils/currency';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

interface InvitationData {
  eventTitle: string;
  hostName: string;
  ticketTypeName: string;
  seatLabel?: string;
  tableLabel?: string;
  priceCents: number;
  status: string;
}

export default function InvitationPage() {
  const { token: invToken } = useParams<{ token: string }>();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!invToken) return;
    const load = async () => {
      try {
        const { data } = await bookingsApi.getInvitation(invToken);
        setInvitation(data as InvitationData);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [invToken]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <Result
        status="404"
        title="Invitation Not Found"
        subTitle="This invitation link may be invalid or expired."
        extra={<Button type="primary" onClick={() => navigate('/')}>Go Home</Button>}
      />
    );
  }

  if (!invitation) return null;

  return (
    <div style={{ maxWidth: 540, margin: '48px auto' }}>
      <Card>
        <Result
          icon={<GiftOutlined />}
          title="You're Invited!"
          subTitle={`${invitation.hostName} has invited you to ${invitation.eventTitle}`}
        />
        <Descriptions column={1} bordered size="small" style={{ marginTop: 16 }}>
          <Descriptions.Item label="Event">{invitation.eventTitle}</Descriptions.Item>
          <Descriptions.Item label="Ticket">{invitation.ticketTypeName}</Descriptions.Item>
          {invitation.tableLabel && (
            <Descriptions.Item label="Table">{invitation.tableLabel}</Descriptions.Item>
          )}
          {invitation.seatLabel && (
            <Descriptions.Item label="Seat">{invitation.seatLabel}</Descriptions.Item>
          )}
          <Descriptions.Item label="Value">{centsToUSD(invitation.priceCents)}</Descriptions.Item>
          <Descriptions.Item label="Status">{invitation.status}</Descriptions.Item>
        </Descriptions>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          {isAuthenticated ? (
            <Button type="primary" size="large" onClick={() => navigate('/bookings')}>
              View My Bookings
            </Button>
          ) : (
            <Button type="primary" size="large" onClick={() => navigate('/login')}>
              Sign In to Accept
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
