import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, App } from 'antd';
import {
  CalendarOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  UserOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminDashboardApi } from '../../../services/api';
import { centsToUSD } from '../../../utils/currency';
import { formatEventDate } from '../../../utils/date';
import type { DashboardStats, NextEventDashboard } from '../../../types/developer';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

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
      <PageHeader title="Dashboard" subtitle="Overview of your platform" />
      {stats && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Total Events"
                value={stats.totalEvents}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Total Bookings"
                value={stats.totalBookings}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Revenue"
                value={centsToUSD(stats.totalRevenueCents)}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Users"
                value={stats.totalUsers}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}
      {nextEvent && (
        <Card
          className="stat-card"
          style={{ marginTop: 24, cursor: 'pointer' }}
          onClick={() => navigate(`/admin/events/${nextEvent.eventId}`)}
        >
          <Row justify="space-between" align="middle">
            <Col>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {nextEvent.eventTitle}
              </div>
              <div style={{ opacity: 0.6 }}>
                {formatEventDate(nextEvent.startDate)} &middot;{' '}
                {nextEvent.venueName}
              </div>
              <div style={{ marginTop: 8 }}>
                {nextEvent.ticketsSold} / {nextEvent.ticketsTotal} tickets sold
                &middot; {centsToUSD(nextEvent.revenueCents)} revenue
              </div>
            </Col>
            <Col>
              <RightOutlined />
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
}
