import { useEffect, useState } from 'react';
import { Button, App, Progress } from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminDashboardApi } from '../../services/api';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import { formatEventDate } from '@code829/shared/utils/date';
import type { DashboardStats, NextEventDashboard } from '@code829/shared/types/developer';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import PulseIndicator from '@code829/shared/components/shared/PulseIndicator';
import EmptyState from '@code829/shared/components/shared/EmptyState';



export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [nextEvent, setNextEvent] = useState<NextEventDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
        title="Dashboard"
        subtitle={[
          "Here’s how your events are performing this week.",
          "4 events are nearing capacity. Consider adding more tickets.",
          "Hi Siddh, welcome back to your central hub."
        ]}
        rotateSubtitle
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/events/new')}
            style={{
              borderRadius: 'var(--radius-full)',
              height: 48,
              padding: '0 32px',
              fontWeight: 700,
              boxShadow: '0 8px 16px hsla(var(--p-h), var(--p-s), var(--p-l), 0.3)'
            }}
          >
            Create Event
          </Button>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {nextEvent && (
          <section>
            <HumanCard
              onClick={() => navigate(`/events/${nextEvent.eventId}`)}
              className="human-noise"
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                color: 'white',
                padding: isMobile ? '24px' : '40px',
                border: 'none',
              }}
            >
              <div className={isMobile ? "" : "asymmetry-grid"} style={{ display: isMobile ? 'flex' : 'grid', flexDirection: 'column', gap: isMobile ? 32 : 24, alignItems: isMobile ? 'stretch' : 'center' }}>
                <div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 16px',
                    borderRadius: 99,
                    background: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 20
                  }}>
                    <PulseIndicator status="calm" size={6} style={{ filter: 'brightness(2)' }} />
                    Next Big Thing
                  </div>

                  <h2 style={{
                    fontSize: 'clamp(32px, 5vw, 48px)',
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 700,
                    margin: '0 0 16px 0',
                    color: 'white',
                    lineHeight: 1.1
                  }}>
                    {nextEvent.title}
                  </h2>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
                      <CalendarOutlined style={{ color: 'var(--accent-gold)' }} />
                      {formatEventDate(nextEvent.startDate)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
                      <EnvironmentOutlined style={{ color: 'rgba(255,255,255,0.8)' }} />
                      {nextEvent.venueName || 'Virtual'}
                    </div>
                  </div>

                  <Button
                    ghost
                    size="large"
                    style={{ borderRadius: 'var(--radius-full)', fontWeight: 700, width: isMobile ? '100%' : 'auto', padding: isMobile ? '0 24px' : '0 32px' }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/events/${nextEvent.eventId}`); }}
                  >
                    Prepare staff brief
                  </Button>
                </div>

                <div style={{
                  background: 'rgba(0,0,0,0.2)',
                  padding: isMobile ? 24 : 32,
                  borderRadius: 'var(--radius-lg)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Guest Progress</span>
                    <span style={{ color: 'white', fontWeight: 800 }}>
                      {nextEvent.soldCount} / {nextEvent.totalCapacity}
                    </span>
                  </div>
                  <Progress
                    percent={(nextEvent.soldCount / nextEvent.totalCapacity) * 100}
                    showInfo={false}
                    strokeColor="#FBBF24"
                    railColor="rgba(255,255,255,0.1)"
                    size={12}
                  />
                  <div style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                    “Ticket sales are up 12% compared to your last rooftop event.”
                  </div>
                </div>
              </div>
            </HumanCard>
          </section>
        )}

        {stats && (
          <section>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 2fr) minmax(0, 1fr)',
              gap: 24
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                <HumanCard
                  title="Guest Experience Signals"
                  subtitle="Latest feedback and NPS snapshots"
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                    <div style={{ padding: 16, background: 'var(--bg-soft)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Vibe Score</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)' }}>4.8<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>/ 5</span></div>
                    </div>
                    <div style={{ padding: 16, background: 'var(--bg-soft)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Entry Pulse</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>92%</div>
                    </div>
                    <div style={{ padding: 16, background: 'var(--primary-soft)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-soft)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 8 }}>Themes</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>“Great lighting, Fast entry”</div>
                    </div>
                  </div>
                </HumanCard>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <HumanCard
                  title="Operational Alerts"
                  subtitle="Critical issues needing resolution"
                  className="human-noise"
                  style={{ borderLeft: '4px solid var(--accent-gold)' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{
                      padding: 12,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-soft)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start'
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-gold)', marginTop: 6 }} className="pulse-soft" />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Device Offline</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Check-in tablet at Midtown Loft.</div>
                      </div>
                    </div>
                    <div style={{
                      padding: 12,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-soft)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start'
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', marginTop: 6 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Capacity Warning</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Summer Gala is 98% sold out.</div>
                      </div>
                    </div>
                  </div>
                </HumanCard>

                <HumanCard title="Today’s Schedule" subtitle="Live tracking of your venues">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <ThunderboltOutlined />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Rooftop Launch</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>8:00 PM • Sky Lounge</div>
                        </div>
                      </div>
                      <PulseIndicator status="success" size={6} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          <CalendarOutlined />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Artist Showcase</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>10:30 PM • Main Hall</div>
                        </div>
                      </div>
                      <PulseIndicator status="calm" size={6} />
                    </div>
                  </div>
                </HumanCard>
              </div>
            </div>
          </section>
        )}

        {!nextEvent && !loading && (
          <EmptyState
            title="Your journey begins"
            description="Host your first event and see live insights transform this space. Ready to design an unforgettable night?"
            actionLabel="Create my first event"
            onAction={() => navigate('/events/new')}
          />
        )}
      </div>
    </div>
  );
}
