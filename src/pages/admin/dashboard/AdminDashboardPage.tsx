import { useEffect, useState } from 'react';
import { Button, App, Progress } from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  ArrowRightOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminDashboardApi } from '../../../services/api';
import { centsToUSD } from '../../../utils/currency';
import { formatEventDate } from '../../../utils/date';
import type { DashboardStats, NextEventDashboard } from '../../../types/developer';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import HumanCard from '../../../components/shared/HumanCard';

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
        message.error('Failed to load your space');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [message]);

  if (loading) return <LoadingSpinner skeleton="hero" />;

  return (
    <div className="spring-up">
      <PageHeader
        title="Your Space"
        subtitle="A warm hello! Here's an overview of your platform."
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/events/new')}
            style={{ 
              borderRadius: 'var(--radius-md)', 
              height: 44, 
              padding: '0 24px',
              fontWeight: 600,
              boxShadow: '0 4px 12px hsla(var(--p-h), var(--p-s), var(--p-l), 0.3)'
            }}
          >
            Create Event
          </Button>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {nextEvent && (
          <section>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ThunderboltOutlined style={{ color: 'var(--accent-gold)' }} />
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Next Big Thing
              </span>
            </div>
            
            <HumanCard
              onClick={() => navigate(`/admin/events/${nextEvent.eventId}`)}
              style={{
                background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-soft) 100%)',
                position: 'relative',
                overflow: 'hidden',
                padding: '32px'
              }}
            >
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  padding: '4px 12px', 
                  borderRadius: 99, 
                  background: 'var(--primary-soft)', 
                  color: 'var(--primary)', 
                  fontSize: 12, 
                  fontWeight: 700,
                  marginBottom: 16
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} className="pulse-soft" />
                  {getCountdownLabel(nextEvent.startDate)}
                </div>

                <h2 style={{ 
                  fontSize: 'clamp(24px, 4vw, 36px)', 
                  fontFamily: "'Playfair Display', serif", 
                  fontWeight: 700, 
                  margin: '0 0 12px 0',
                  color: 'var(--text-primary)'
                }}>
                  {nextEvent.title}
                </h2>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                    <CalendarOutlined style={{ color: 'var(--accent-gold)' }} />
                    {formatEventDate(nextEvent.startDate)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                    <EnvironmentOutlined style={{ color: 'var(--primary)' }} />
                    {nextEvent.venueName}
                  </div>
                </div>

                <div style={{ maxWidth: 500 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Ticket Sales</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                      {nextEvent.soldCount} / {nextEvent.totalCapacity} ({Math.round((nextEvent.soldCount / nextEvent.totalCapacity) * 100)}%)
                    </span>
                  </div>
                  <Progress 
                    percent={(nextEvent.soldCount / nextEvent.totalCapacity) * 100} 
                    showInfo={false}
                    strokeColor={{ '0%': 'var(--primary)', '100%': 'var(--accent-gold)' }}
                    trailColor="var(--border)"
                    strokeWidth={10}
                  />
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{centsToUSD(nextEvent.revenueCents)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{nextEvent.totalCapacity - nextEvent.soldCount}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                       <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 14 }}>
                        Manage <ArrowRightOutlined />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div style={{ 
                position: 'absolute', 
                top: '-50px', 
                right: '-50px', 
                width: 200, 
                height: 200, 
                borderRadius: '50%', 
                background: 'var(--primary-soft)', 
                filter: 'blur(60px)',
                opacity: 0.5
              }} />
            </HumanCard>
          </section>
        )}

        {stats && (
          <section>
            <div className="asymmetry-grid">
              <HumanCard 
                title="Grand Totals" 
                subtitle="High-level performance metrics"
                style={{ height: '100%' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '12px 0' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Total Sales</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary)', fontFamily: "'Playfair Display', serif" }}>
                      {centsToUSD(stats.totalRevenueCents)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Total Bookings</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif" }}>
                      {stats.totalBookings.toLocaleString()}
                    </div>
                  </div>
                </div>
              </HumanCard>

              <HumanCard
                title="Platform Reach"
                subtitle="Your growing community"
                variant="glass"
                style={{ background: 'var(--primary)', color: 'white', borderColor: 'transparent' }}
              >
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                   <div style={{ fontSize: 48, fontWeight: 700, color: 'white', fontFamily: "'Playfair Display', serif" }}>
                    {stats.totalEvents}
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Live Events Organized</div>
                </div>
              </HumanCard>
            </div>
          </section>
        )}

        {!nextEvent && !loading && (
          <HumanCard style={{ textAlign: 'center', padding: '60px 24px' }} hover={false}>
            <CalendarOutlined style={{ fontSize: 48, color: 'var(--primary)', opacity: 0.2, marginBottom: 16 }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Quiet at the moment</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 300, marginInline: 'auto' }}>
              No upcoming events are scheduled. Ready to create something special?
            </p>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => navigate('/admin/events/new')}
              style={{ borderRadius: 'var(--radius-full)', height: 44, padding: '0 32px' }}
            >
              Set up an event
            </Button>
          </HumanCard>
        )}
      </div>
    </div>
  );
}
