import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { Search, DollarSign, Save, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { developerApi } from '../../services/developerApi';
import { Link } from 'react-router-dom';

interface TicketType {
  id: string;
  name: string;
  priceCents: number;
  quantityTotal: number;
  quantitySold: number;
  remaining: number;
  sortOrder: number;
  platformFeeCents: number;
}

interface EventItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  startDate: string;
  endDate: string;
  isFeatured: boolean;
  venue?: { name: string; city: string; state: string };
  ticketTypes: TicketType[];
  platformFeePercent?: number;
}

interface PaginatedResponse {
  items: EventItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export default function DeveloperEventsPage(): React.ReactElement {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feeEdits, setFeeEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    async function fetch(): Promise<void> {
      try {
        const res = await developerApi.events.list<PaginatedResponse>({ pageSize: 100 });
        if (!cancelled) setEvents(res.data.items);
      } catch {
        if (!cancelled) toast.error('Failed to load events');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetch();
    return () => { cancelled = true; };
  }, []);

  const filtered = search.trim()
    ? events.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        e.status.toLowerCase().includes(search.toLowerCase()) ||
        (e.venue?.name ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : events;

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatCents(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  async function savePlatformFees(eventId: string): Promise<void> {
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;
    setSaving(p => ({ ...p, [eventId]: true }));
    try {
      const ticketFees = ev.ticketTypes.map(tt => ({
        ticketTypeId: tt.id,
        platformFeeCents: feeEdits[tt.id] ?? tt.platformFeeCents,
      }));
      await developerApi.events.updatePlatformFees(eventId, { ticketFees });
      toast.success('Platform fees updated');
      setEvents(prev => prev.map(e => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          ticketTypes: e.ticketTypes.map(tt => ({
            ...tt,
            platformFeeCents: feeEdits[tt.id] ?? tt.platformFeeCents,
          })),
        };
      }));
    } catch {
      toast.error('Failed to update fees');
    } finally {
      setSaving(p => ({ ...p, [eventId]: false }));
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'Published': return { bg: 'color-mix(in srgb, var(--color-success) 12%, transparent)', fg: 'var(--color-success)' };
      case 'Draft': return { bg: 'color-mix(in srgb, var(--color-warning) 12%, transparent)', fg: 'var(--color-warning)' };
      case 'Completed': return { bg: 'color-mix(in srgb, var(--text-tertiary) 12%, transparent)', fg: 'var(--text-tertiary)' };
      case 'Cancelled': return { bg: 'color-mix(in srgb, var(--color-error) 12%, transparent)', fg: 'var(--color-error)' };
      default: return { bg: 'var(--bg-tertiary)', fg: 'var(--text-secondary)' };
    }
  };

  return (
    <>
      <Helmet><title>Events (Read-Only) — Developer — Code829</title></Helmet>

      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Events
            </h1>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
              Read-only view. Manage platform fees per ticket type.
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search events by title, category, status, or venue..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '0.625rem 0.875rem 0.625rem 2.5rem',
              borderRadius: '0.5rem', border: '1px solid var(--border)',
              background: 'var(--bg-secondary)', color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {loading ? (
          <div style={{ height: '200px', borderRadius: '0.75rem', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
            {search ? `No events matching "${search}"` : 'No events found.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map(ev => {
              const expanded = expandedId === ev.id;
              const sc = statusColor(ev.status);
              return (
                <div key={ev.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                  {/* Event header row */}
                  <div
                    style={{
                      padding: '1rem 1.25rem', display: 'flex', alignItems: 'center',
                      gap: '1rem', cursor: 'pointer',
                    }}
                    onClick={() => setExpandedId(expanded ? null : ev.id)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{ev.title}</span>
                        <span style={{
                          padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.6875rem',
                          fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                          background: sc.bg, color: sc.fg,
                        }}>{ev.status}</span>
                        <span style={{
                          padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.6875rem',
                          fontWeight: 500, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                        }}>{ev.category}</span>
                      </div>
                      <div style={{ marginTop: '0.35rem', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                        {formatDate(ev.startDate)} &middot; {ev.venue?.name ?? 'No venue'}, {ev.venue?.city ?? ''} {ev.venue?.state ?? ''}
                      </div>
                    </div>
                    <Link
                      to={`/events/${ev.id}`}
                      onClick={e => e.stopPropagation()}
                      style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8125rem', textDecoration: 'none', fontWeight: 500 }}
                    >
                      <Eye size={14} /> View
                    </Link>
                    {expanded ? <ChevronUp size={18} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-tertiary)' }} />}
                  </div>

                  {/* Expanded: ticket types with platform fee editing */}
                  {expanded && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <DollarSign size={16} style={{ color: 'var(--accent-primary)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Platform Fees by Ticket Type</span>
                      </div>
                      {ev.ticketTypes.length === 0 ? (
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>No ticket types for this event.</p>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                          <caption style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
                            Platform fees by ticket type for {ev.title}
                          </caption>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Ticket Type</th>
                              <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Price</th>
                              <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Sold</th>
                              <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Platform Fee</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ev.ticketTypes.map(tt => (
                              <tr key={tt.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.625rem 0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>{tt.name}</td>
                                <td style={{ padding: '0.625rem 0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{formatCents(tt.priceCents)}</td>
                                <td style={{ padding: '0.625rem 0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{tt.quantitySold} / {tt.quantityTotal}</td>
                                <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      defaultValue={(tt.platformFeeCents / 100).toFixed(2)}
                                      onChange={e => setFeeEdits(p => ({ ...p, [tt.id]: Math.round((parseFloat(e.target.value) || 0) * 100) }))}
                                      style={{
                                        width: '80px', padding: '0.3rem 0.5rem',
                                        borderRadius: '0.375rem', border: '1px solid var(--border)',
                                        background: 'var(--bg-primary)', color: 'var(--text-primary)',
                                        fontSize: '0.8125rem', textAlign: 'right', outline: 'none',
                                      }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                      {ev.ticketTypes.length > 0 && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => void savePlatformFees(ev.id)}
                            disabled={saving[ev.id]}
                            style={{
                              padding: '0.5rem 1.25rem', borderRadius: '0.5rem',
                              border: 'none', background: 'var(--accent-primary)',
                              color: 'var(--bg-primary)', fontWeight: 600, fontSize: '0.8125rem',
                              cursor: saving[ev.id] ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', gap: '0.375rem',
                              opacity: saving[ev.id] ? 0.7 : 1,
                            }}
                          >
                            <Save size={14} />
                            {saving[ev.id] ? 'Saving...' : 'Save Fees'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
    </>
  );
}
