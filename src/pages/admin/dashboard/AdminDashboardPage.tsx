import { useEffect, useState } from 'react';
import { Button, App } from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  ArrowRightOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminDashboardApi } from '../../../services/api';
import { centsToUSD } from '../../../utils/currency';
import { formatEventDate } from '../../../utils/date';
import type { DashboardStats, NextEventDashboard } from '../../../types/developer';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

function getCountdownLabel(startDate: string): string {
  const now = new Date();
  const start = new Date(startDate);
  const diffMs = start.getTime() - now.getTime();
  if (diffMs <= 0) return 'Happening Now';
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `In ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return 'In 1 week';
  return `In ${diffWeeks} weeks`;
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
        <div className="mini-kpi-strip">
          <div className="mini-kpi-card">
            <div className="mini-kpi-value">{stats.totalEvents}</div>
            <div className="mini-kpi-label">Events</div>
          </div>
          <div className="mini-kpi-card">
            <div className="mini-kpi-value">{stats.totalBookings}</div>
            <div className="mini-kpi-label">Bookings</div>
          </div>
          <div className="mini-kpi-card">
            <div className="mini-kpi-value">{centsToUSD(stats.totalRevenueCents)}</div>
            <div className="mini-kpi-label">Revenue</div>
          </div>
        </div>
      )}

      {nextEvent ? (
        <div
          className="next-event-hero"
          onClick={() => navigate(`/admin/events/${nextEvent.eventId}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate(`/admin/events/${nextEvent.eventId}`)}
        >
          <div className="next-event-countdown">
            ⚡ {getCountdownLabel(nextEvent.startDate)}
          </div>

          <div className="next-event-title">{nextEvent.eventTitle}</div>

          <div className="next-event-meta">
            <span className="next-event-meta-item">
              <CalendarOutlined style={{ color: 'var(--accent-gold)' }} />
              {formatEventDate(nextEvent.startDate)}
            </span>
            <span className="next-event-meta-item">
              <EnvironmentOutlined style={{ color: 'var(--accent-violet)' }} />
              {nextEvent.venueName}
            </span>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 14, marginBottom: 6 }}>
              <span>Tickets Sold</span>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                {nextEvent.ticketsSold} / {nextEvent.ticketsTotal}
              </span>
            </div>
            <div className="next-event-progress-bar">
              <div
                className="next-event-progress-fill"
                style={{
                  width: `${nextEvent.ticketsTotal > 0
                    ? Math.min((nextEvent.ticketsSold / nextEvent.ticketsTotal) * 100, 100)
                    : 0}%`
                }}
              />
            </div>
          </div>

          <div className="next-event-stats">
            <div className="next-event-stat">
              <div className="next-event-stat-value">
                {nextEvent.ticketsTotal > 0
                  ? `${Math.round((nextEvent.ticketsSold / nextEvent.ticketsTotal) * 100)}%`
                  : '0%'}
              </div>
              <div className="next-event-stat-label">Sold</div>
            </div>
            <div className="next-event-stat">
              <div className="next-event-stat-value">{centsToUSD(nextEvent.revenueCents)}</div>
              <div className="next-event-stat-label">Revenue</div>
            </div>
            <div className="next-event-stat">
              <div className="next-event-stat-value">{nextEvent.ticketsTotal - nextEvent.ticketsSold}</div>
              <div className="next-event-stat-label">Available</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14, position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: 13, color: '#A78BFA', fontWeight: 600 }}>
              View Event <ArrowRightOutlined />
            </span>
          </div>
        </div>
      ) : (
        <div className="admin-section" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <CalendarOutlined style={{ fontSize: 40, color: 'var(--accent-violet)', opacity: 0.4, display: 'block', marginBottom: 12 }} />
          <div style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>No upcoming events scheduled</div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/events/new')} style={{ borderRadius: 99 }}>
            Create Your First Event
          </Button>
        </div>
      )}
    </div>
  );
}
