import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Alert, Empty, Spin } from 'antd';
import { LinkOutlined, ShopOutlined } from '@ant-design/icons';
import { Link, useParams } from 'react-router-dom';
import type { Sponsor, SponsorMetaItem } from '@code829/shared/types/sponsor';
import { sponsorService } from '../../services/api';
import { createLogger } from '@code829/shared/lib/logger';
import { ORGANIZER_NAME } from '@code829/shared';

const log = createLogger('Public/SponsorDetailPage');
const SPONSOR_NOT_FOUND_TEXT = 'Sponsor not found';
const UPCOMING_EVENTS_TEXT = 'Upcoming events';
const DETAILS_TEXT = 'Details';
const WEBSITE_TEXT = 'Website';
const NO_UPCOMING_EVENTS_TEXT = 'No upcoming events';

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

export default function SponsorDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [events, setEvents] = useState<EventLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const { data: s } = await sponsorService.getPublicBySlug(slug);
      setSponsor(s);
      const { data: ev } = await sponsorService.getPublicEvents(slug, 'upcoming', 1, 50);
      setEvents((ev as { items?: EventLite[] }).items ?? []);
      setNotFound(false);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } };
      if (e?.response?.status === 404) setNotFound(true);
      else log.error('load sponsor failed', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}><Spin size="large" /></div>;
  if (notFound) return <Alert type="error" message={SPONSOR_NOT_FOUND_TEXT} style={{ maxWidth: 600, margin: '60px auto' }} />;
  if (!sponsor) return null;

  const description = sponsor.meta.find((m) => /^(description|bio)$/i.test(m.key))?.value ?? null;
  const website = sponsor.meta.find((m) => /^(website|url)$/i.test(m.key))?.value ?? null;
  const otherMeta = sponsor.meta.filter((m) => {
    if (/^(description|bio|website|url)$/i.test(m.key)) return false;
    const v = m.value;
    return typeof v === 'string' && v.trim().length > 0;
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px 80px' }}>
      <Helmet>
        <title>{`${sponsor.name} - ${ORGANIZER_NAME}`}</title>
        <link rel="canonical" href={`https://${ORGANIZER_NAME.toLowerCase()}.com/sponsors/${sponsor.slug}`} />
      </Helmet>
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 40 }}>
        <div
          style={{
            width: 240,
            height: 240,
            borderRadius: 16,
            background: 'var(--bg-elevated, #fff)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: 'var(--shadow-md)',
            padding: 24,
          }}
        >
          {sponsor.primaryImageUrl ? (
            <img src={sponsor.primaryImageUrl} alt={sponsor.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          ) : (
            <ShopOutlined style={{ fontSize: 80, color: 'var(--text-muted)' }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 6, height: 48, borderRadius: 10, background: 'var(--gradient-brand, var(--primary))' }} />
            <h1 style={{ margin: 0, fontSize: 40, fontWeight: 900, color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif" }}>
              {sponsor.name}
            </h1>
          </div>
          {description && (
            <p style={{ marginTop: 16, fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {description}
            </p>
          )}
          {website && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="sponsor-pill"
                style={pillStyle}
              >
                <LinkOutlined /> {WEBSITE_TEXT}
              </a>
            </div>
          )}
        </div>
      </div>

      {otherMeta.length > 0 && (
        <section className="glass-card" style={sectionStyle}>
          <h2 style={sectionHeadStyle}>{DETAILS_TEXT}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {otherMeta.map((m: SponsorMetaItem) => (
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
        <h2 style={sectionHeadStyle}>{UPCOMING_EVENTS_TEXT}</h2>
        {events.length === 0 ? (
          <Empty description={NO_UPCOMING_EVENTS_TEXT} />
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
