import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, App } from 'antd';
import {
  CalendarOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  UserOutlined,
  RiseOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { adminDashboardApi } from '../../services/api';
import { centsToUSD } from '@code829/shared/utils/currency';
import type { DashboardStats } from '@code829/shared/types/developer';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await adminDashboardApi.getStats();
        setStats(data);
      } catch {
        message.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [message]);

  if (loading) return <LoadingSpinner />;
  if (!stats) return null;

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Platform performance overview" />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card className="stat-card">
            <Statistic title="Total Events" value={stats.totalEvents} prefix={<CalendarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="stat-card">
            <Statistic title="Total Purchases" value={stats.totalBookings} prefix={<ShoppingCartOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="stat-card">
            <Statistic title="Total Revenue" value={centsToUSD(stats.totalRevenueCents)} prefix={<DollarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="stat-card">
            <Statistic title="Total Users" value={stats.totalUsers} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="stat-card">
            <Statistic title="Upcoming Events" value={stats.upcomingEvents} prefix={<RiseOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="stat-card">
            <Statistic title="Recent Purchases" value={stats.recentBookings} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
