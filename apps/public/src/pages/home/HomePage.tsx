import { useNavigate } from 'react-router-dom';
import { ArrowRightOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useEventListVM } from '@code829/shared/viewmodels';
import { Button, Skeleton } from '@code829/ui';
import EventCard from '../../components/events/EventCard';

export default function HomePage() {
  const navigate = useNavigate();
  const { events, loading } = useEventListVM({ pageSize: 6 });

  const featured = events.filter((e) => e.isFeatured);
  const display = featured.length > 0 ? featured : events;

  const stats = [
    { n: `${events.length || 6}`, l: 'Events this season' },
    { n: '12', l: 'Partner venues' },
    { n: '4.9', l: 'Guest rating' },
  ];

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Helmet><title>Curated evenings, thoughtfully seated — Code829</title></Helmet>

      <section className="c829-hero" style={{ position: 'relative', overflow: 'hidden', padding: '120px 32px 110px' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
          <div
            className="c829-kenburns"
            style={{
              position: 'absolute',
              inset: '-6%',
              backgroundImage: 'url(/site-bg.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center 30%',
              filter: 'contrast(1.08) saturate(0.9)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, var(--primary-muted), var(--primary-soft) 40%, transparent 70%), linear-gradient(180deg, var(--bg-overlay) 0%, rgba(15,11,26,0.25) 40%, var(--bg-page) 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.06,
              backgroundImage: 'radial-gradient(circle at 1px 1px, var(--text-primary) 1px, transparent 0)',
              backgroundSize: '3px 3px',
            }}
          />
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 1200,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
            gap: 72,
            alignItems: 'center',
          }}
          className="c829-hero-grid"
        >
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 14px',
                background: 'var(--bg-overlay)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                color: 'var(--primary-light)',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--primary-muted)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  boxShadow: '0 0 12px var(--primary)',
                }}
              />
              Spring / Summer 2026
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(2.6rem, 6vw, 4.5rem)',
                fontWeight: 700,
                lineHeight: 1.12,
                letterSpacing: '-0.04em',
                color: 'var(--text-primary)',
                margin: 0,
                textWrap: 'balance',
                paddingBottom: 4,
              }}
            >
              Curated evenings,<br />
              <em className="c829-shimmer" style={{ fontStyle: 'italic', fontWeight: 400 }}>
                thoughtfully seated.
              </em>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              style={{
                fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
                color: 'var(--text-secondary)',
                margin: '32px 0',
                maxWidth: 460,
                lineHeight: 1.6,
              }}
            >
              A private bookings platform for chamber music, tasting dinners, and intimate benefits.
              Every seat held until payment; every table, claimed with care.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
            >
              <Button variant="primary" size="md" onClick={() => navigate('/events')} trailingIcon={<ArrowRightOutlined />}>
                Browse events
              </Button>
              <Button variant="secondary" size="md" onClick={() => navigate('/events')}>
                Upcoming schedule
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              style={{ marginTop: 48, display: 'flex', gap: 40, flexWrap: 'wrap' }}
            >
              {stats.map((x) => (
                <div key={x.l}>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 32,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1,
                    }}
                  >
                    {x.n}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginTop: 6,
                    }}
                  >
                    {x.l}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ position: 'relative' }}
            className="c829-hero-card"
          >
            <div
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                aspectRatio: '4 / 5',
                boxShadow: 'var(--shadow-hover), 0 0 0 1px var(--primary-muted)',
                transform: 'rotate(1deg)',
              }}
            >
              <img
                src="/site-bg.jpg"
                alt="Our organizers"
                className="c829-kenburns"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 16,
                  bottom: 16,
                  right: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-overlay)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                      color: 'var(--primary-light)',
                      marginBottom: 3,
                    }}
                  >
                    Your hosts
                  </div>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 15,
                      color: 'var(--text-primary)',
                      fontStyle: 'italic',
                    }}
                  >
                    The Code 829 Collective
                  </div>
                </div>
                <button
                  onClick={() => navigate('/events')}
                  aria-label="Browse events"
                  className="c829-pulse"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    border: 'none',
                    color: 'var(--text-on-brand)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <ArrowRightOutlined />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section style={{ padding: '60px 32px 100px', maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 32,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Next in season
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/events')}>
            View all →
          </Button>
        </div>

        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} shape="rect" height={400} style={{ borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : (
          <div
            className="c829-stagger"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
            {display.slice(0, 6).map((event) => (
              <div key={event.id} className="c829-fade-up c829-card-hover">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}
      </section>

      <style>{`
        @media (max-width: 768px) {
          .c829-hero { padding: 48px 20px 56px !important; }
          .c829-hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .c829-hero-card { order: -1; }
          .c829-hero-card > div { aspect-ratio: 16 / 11 !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}
