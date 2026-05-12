import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserOutlined } from '@ant-design/icons';
import type { EventPerformer } from '@code829/shared/types/performer';
import apiClient from '@code829/shared/lib/axios';

interface Props {
  eventSlug: string;
}

export default function EventLineup({ eventSlug }: Props) {
  const [performers, setPerformers] = useState<EventPerformer[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get<EventPerformer[]>(`/events/by-slug/${eventSlug}/performers`);
        if (!cancelled) setPerformers(data);
      } catch {
        if (!cancelled) setPerformers([]);
      }
    })();
    return () => { cancelled = true; };
  }, [eventSlug]);

  if (!performers || performers.length === 0) return null;

  return (
    <div className="glass-card" style={{ padding: 24, borderRadius: 16, marginTop: 24, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 6, height: 32, borderRadius: 10, background: 'var(--gradient-brand, var(--primary))' }} />
        <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Performers</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16 }}>
        {performers.map((p) => {
          const role = p.effectiveMeta.find((m) => /^role$/i.test(m.key))?.value ?? null;
          return (
            <Link
              key={p.performerId}
              to={`/performers/${p.slug}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: 12,
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated, #fff)',
                color: 'inherit',
                textDecoration: 'none',
                transition: 'transform .15s ease, box-shadow .15s ease',
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'var(--bg-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {p.primaryImageUrl ? (
                  <img src={p.primaryImageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <UserOutlined style={{ fontSize: 36, color: 'var(--text-muted)' }} />
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, textAlign: 'center' }}>{p.name}</div>
              {role && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{role}</div>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
