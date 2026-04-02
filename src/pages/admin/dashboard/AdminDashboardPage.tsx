import { useEffect, useState } from 'react';
import { Row, Col, Button, App } from 'antd';
import {
  CalendarOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  UserOutlined,
  RightOutlined,
  PlusOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminDashboardApi } from '../../../services/api';
import { centsToUSD } from '../../../utils/currency';
import { formatEventDate } from '../../../utils/date';
import type { DashboardStats, NextEventDashboard } from '../../../types/developer';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
}

function StatCard({ icon, iconBg, label, value }: StatCardProps) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {value}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [nextEvent, setNextEvent] = useState<NextEventDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, nextRes] = await Promise.all([
          adminDashboardApi.getStats(),
          adminDashboardApi.getNextEvent(),
        ]);
        setStats(statsRes.data);
        if (nextRes.data.hasUpcoming && nextRes.data.data) {
          setNextEvent(nextRes.data.data);
        }
      } catch {
        message.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [message]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your platform"
        extra={
          <div className="hero-cta-row" style={{ maxWidth: 'none' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/events/new')}
              style={{ borderRadius: 10, fontWeight: 600 }}
            >
              New Event
            </Button>
          </div>
        }
      />

      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} lg={6}>
            <StatCard
              icon={<CalendarOutlined style={{ color: 'var(--accent-violet)' }} />}
              iconBg="rgba(124, 58, 237, 0.12)"
              label="Total Events"
              value={stats.totalEvents}
            />
          </Col>
          <Col xs={12} lg={6}>
            <StatCard
              icon={<ShoppingCartOutlined style={{ color: 'var(--accent-gold)' }} />}
              iconBg="rgba(245, 158, 11, 0.12)"
              label="Total Bookings"
              value={stats.totalBookings}
            />
          </Col>
          <Col xs={12} lg={6}>
            <StatCard
              icon={<DollarOutlined style={{ color: 'var(--accent-green)' }} />}
              iconBg="rgba(16, 185, 129, 0.12)"
              label="Revenue"
              value={centsToUSD(stats.totalRevenueCents)}
            />
          </Col>
          <Col xs={12} lg={6}>
            <StatCard
              icon={<UserOutlined style={{ color: 'var(--accent-cyan)' }} />}
              iconBg="rgba(6, 182, 212, 0.12)"
              label="Users"
              value={stats.totalUsers}
            />
          </Col>
        </Row>
      )}

      {nextEvent && (
        <div
          className="stat-card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/admin/events/${nextEvent.eventId}`)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
                <CheckCircleOutlined style={{ color: 'var(--accent-violet)', marginRight: 8 }} />
                {nextEvent.eventTitle}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {formatEventDate(nextEvent.startDate)} &middot; {nextEvent.venueName}
              </div>
              <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                {nextEvent.ticketsSold} / {nextEvent.ticketsTotal} tickets sold &middot; {centsToUSD(nextEvent.revenueCents)} revenue
              </div>
            </div>
            <RightOutlined style={{ color: 'var(--text-muted)', fontSize: 16 }} />
          </div>
        </div>
      )}
    </div>
  );
}
