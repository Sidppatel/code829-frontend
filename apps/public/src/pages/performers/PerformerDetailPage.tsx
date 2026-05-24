import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Alert, Empty, Spin } from 'antd';
import {
  FacebookOutlined,
  InstagramOutlined,
  LinkOutlined,
  TwitterOutlined,
  UserOutlined,
  YoutubeOutlined,
} from '@ant-design/icons';
import { Link, useParams } from 'react-router-dom';
import type { Performer, PerformerMetaItem } from '@code829/shared/types/performer';
import { performerService } from '../../services/api';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Public/PerformerDetailPage');

interface EventLite {
  eventId: string;
  title: string;
  slug: string;
  startDate: string;
  imageUrl: string | null;
  venueName: string;
  venueCity: string;
  venueState: string;
}

const socialIcon = (key: string) => {
  const lower = key.toLowerCase();
  if (lower.includes('instagram')) return <InstagramOutlined />;
  if (lower.includes('twitter') || lower === 'x') return <TwitterOutlined />;
  if (lower.includes('facebook')) return <FacebookOutlined />;
  if (lower.includes('youtube')) return <YoutubeOutlined />;
  if (lower.includes('tiktok')) return <UserOutlined />;
  return <LinkOutlined />;
};

const isUrl = (s: string | null): boolean => {
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function PerformerDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [performer, setPerformer] = useState<Performer | null>(null);
  const [events, setEvents] = useState<EventLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const { data: p } = await performerService.getPublicBySlug(slug);
      setPerformer(p);
      const { data: ev } = await performerService.getPublicEvents(slug, 'upcoming', 1, 50);
      setEvents((ev as { items?: EventLite[] }).items ?? []);
      setNotFound(false);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } };
      if (e?.response?.status === 404) setNotFound(true);
      else log.error('load performer failed', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}><Spin size="large" /></div>;
  if (notFound) return <Alert type="error" message="Performer not found" style={{ maxWidth: 600, margin: '60px auto' }} />;
  if (!performer) return null;

  const bio = performer.meta.find((m) => /^(bio|description)$/i.test(m.key))?.value ?? null;
  const website = performer.meta.find((m) => /^(website|url)$/i.test(m.key))?.value ?? null;
  const socials = performer.meta.filter((m) =>
    isUrl(m.value) &&
    !/^(website|url|bio|description|role)$/i.test(m.key)
  );
  const otherMeta = performer.meta.filter((m) => {
    if (isUrl(m.value)) return false;
    if (/^(bio|description|website|url)$/i.test(m.key)) return false;
    const v = m.value;
    return typeof v === 'string' && v.trim().length > 0;
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px 80px' }}>
      <Helmet>
        <title>{performer.name} - Code829</title>
        <link rel="canonical" href={`https://code829.com/performers/${performer.slug}`} />
      </Helmet>
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 40 }}>
        <div
          style={{
            width: 240,
            height: 240,
            borderRadius: 16,
            background: 'var(--bg-soft)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {performer.primaryImageUrl ? (
            <img src={performer.primaryImageUrl} alt={performer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <UserOutlined style={{ fontSize: 80, color: 'var(--text-muted)' }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 6, height: 48, borderRadius: 10, background: 'var(--gradient-brand, var(--primary))' }} />
            <h1 style={{ margin: 0, fontSize: 40, fontWeight: 900, color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif" }}>
              {performer.name}
            </h1>
          </div>
          {bio && (
            <p style={{ marginTop: 16, fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {bio}
            </p>
          )}
          {(socials.length > 0 || website) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="performer-pill"
                  style={pillStyle}
                >
                  <LinkOutlined /> Website
                </a>
              )}
              {socials.map((m) => (
                <a
                  key={m.key}
                  href={m.value!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="performer-pill"
                  style={pillStyle}
                >
                  {socialIcon(m.key)} {m.key}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {otherMeta.length > 0 && (
        <section className="glass-card" style={sectionStyle}>
          <h2 style={sectionHeadStyle}>{'Details'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {otherMeta.map((m: PerformerMetaItem) => (
              <div key={m.key}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {m.key}
                </div>
                <div style={{ fontSize: 15, color: 'var(--text-primary)' }}>{m.value}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="glass-card" style={sectionStyle}>
        <h2 style={sectionHeadStyle}>{'Upcoming events'}</h2>
        {events.length === 0 ? (
          <Empty description="No upcoming events" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {events.map((e) => (
              <Link
                key={e.eventId}
                to={`/events/${e.slug}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--bg-elevated, #fff)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <div style={{ position: 'relative', height: 200, overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
                  {e.imageUrl && (
                    <img 
                      src={e.imageUrl} 
                      alt={e.title} 
                      loading="lazy"
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'transform 0.5s var(--ease-human)',
                        transform: 'scale(1)'
                      }} 
                    />
                  )}
                </div>
                <div style={{ padding: 14 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 700 }}>{e.title}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {new Date(e.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' · '}{e.venueName}, {e.venueCity}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 14px',
  borderRadius: 999,
  background: 'var(--bg-soft)',
  border: '1px solid var(--border)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text-primary)',
  textDecoration: 'none',
};

const sectionStyle: React.CSSProperties = {
  padding: 24,
  borderRadius: 16,
  marginBottom: 24,
  border: '1px solid var(--border)',
};

const sectionHeadStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  fontSize: 22,
  fontWeight: 800,
  color: 'var(--text-primary)',
};
