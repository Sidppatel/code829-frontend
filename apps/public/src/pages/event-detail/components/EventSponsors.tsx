import { useEffect, useState } from 'react';
import { ShopOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import type { EventSponsor } from '@code829/shared/types/sponsor';
import apiClient from '@code829/shared/lib/axios';

interface Props {
  eventSlug: string;
}

const TIER_ORDER = [
  'platinum',
  'gold',
  'silver',
  'bronze',
  'partner',
  'sponsor',
  'supporter',
  'contributor',
];

function getTierIndex(tier: string): number {
  const idx = TIER_ORDER.indexOf(tier.toLowerCase());
  return idx === -1 ? TIER_ORDER.length : idx;
}

const SPONSORS_TITLE_TEXT = 'Sponsors';

export default function EventSponsors({ eventSlug }: Props) {
  const [sponsors, setSponsors] = useState<EventSponsor[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get<EventSponsor[]>(`/events/by-slug/${eventSlug}/sponsors`);
        if (!cancelled) setSponsors(data);
      } catch {
        if (!cancelled) setSponsors([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventSlug]);

  if (!sponsors || sponsors.length === 0) return null;

  const grouped = sponsors.reduce((acc, s) => {
    const tierMeta = s.effectiveMeta.find((m) => /^tier$/i.test(m.key));
    const tier = tierMeta?.value || 'Sponsor';
    if (!acc.has(tier)) acc.set(tier, []);
    acc.get(tier)!.push(s);
    return acc;
  }, new Map<string, EventSponsor[]>());

  const sortedTiers = Array.from(grouped.keys()).sort((a, b) => {
    const idxA = getTierIndex(a);
    const idxB = getTierIndex(b);
    if (idxA !== idxB) return idxA - idxB;
    return a.localeCompare(b);
  });

  return (
    <div className="glass-card" style={{ padding: 24, borderRadius: 16, marginTop: 24, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 6, height: 32, borderRadius: 10, background: 'var(--gradient-brand, var(--primary))' }} />
        <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{SPONSORS_TITLE_TEXT}</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {sortedTiers.map((tier) => {
          const rawSponsors = grouped.get(tier) || [];
          const tierSponsors = [...rawSponsors].sort((a, b) => a.sortOrder - b.sortOrder);
          const tierLower = tier.toLowerCase();
          const isGoldOrPlat = tierLower === 'gold' || tierLower === 'platinum';
          const isSilver = tierLower === 'silver';

          let gridMin = '110px';
          let height = 70;
          let padding = '12px';
          let borderStyle = '1px solid var(--border)';
          let glow = 'none';

          if (isGoldOrPlat) {
            gridMin = '160px';
            height = 100;
            padding = '18px';
            borderStyle = tierLower === 'platinum'
              ? '2px solid color-mix(in srgb, var(--text-primary) 30%, transparent)'
              : '2px solid color-mix(in srgb, var(--accent-gold, #ffd700) 50%, transparent)';
            glow = tierLower === 'platinum'
              ? '0 8px 24px color-mix(in srgb, var(--text-primary) 5%, transparent)'
              : '0 8px 24px color-mix(in srgb, var(--accent-gold, #ffd700) 8%, transparent)';
          } else if (isSilver) {
            gridMin = '130px';
            height = 85;
            padding = '14px';
          }

          return (
            <div key={tier} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: isGoldOrPlat
                  ? 'var(--accent-gold, var(--text-primary))'
                  : 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                borderBottom: '1px solid var(--border)',
                paddingBottom: 4,
                display: 'inline-block',
                alignSelf: 'flex-start'
              }}>
                {tier}
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(${gridMin}, 1fr))`,
                gap: 16
              }}>
                {tierSponsors.map((s) => {
                  const sponsorCard = (
                    <div
                      style={{
                        height,
                        padding,
                        borderRadius: 12,
                        border: borderStyle,
                        background: 'var(--bg-elevated, #fff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
                        cursor: 'pointer',
                        boxShadow: glow,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = isGoldOrPlat
                          ? (tierLower === 'platinum'
                            ? '0 12px 30px color-mix(in srgb, var(--text-primary) 12%, transparent)'
                            : '0 12px 30px color-mix(in srgb, var(--accent-gold, #ffd700) 18%, transparent)')
                          : '0 8px 20px rgba(0,0,0,0.1)';
                        if (!isGoldOrPlat) {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = glow;
                        if (!isGoldOrPlat) {
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }
                      }}
                    >
                      {s.primaryImageUrl ? (
                        <img
                          src={s.primaryImageUrl}
                          alt={s.name}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            filter: 'var(--sponsor-logo-filter, none)',
                          }}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <ShopOutlined style={{ fontSize: isGoldOrPlat ? 24 : 18, color: 'var(--text-muted)' }} />
                          <div style={{
                            fontSize: isGoldOrPlat ? 13 : 11,
                            fontWeight: 700,
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%'
                          }}>
                            {s.name}
                          </div>
                        </div>
                      )}
                    </div>
                  );

                  return (
                    <Link
                      key={s.sponsorId}
                      to={`/sponsors/${s.slug}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      {sponsorCard}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
