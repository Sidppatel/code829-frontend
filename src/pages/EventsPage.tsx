import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, ChevronDown, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import EventCard, { type EventData } from '../components/EventCard';
import { SkeletonCard } from '../components/Skeleton';
import apiClient from '../lib/axios';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ApiEventItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  startDate: string;
  endDate: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  venueName: string;
  venueCity: string;
  venueState: string;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  totalCapacity: number | null;
  totalSold: number | null;
}

interface ApiEventsResponse {
  items: ApiEventItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

type TimeGroup = 'Today' | 'This Weekend' | 'Next Week' | 'Later This Month' | 'Upcoming';

interface GroupedEvents {
  label: TimeGroup;
  events: EventData[];
}

function apiItemToEventData(item: ApiEventItem): EventData {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    category: item.category,
    startDate: item.startDate,
    venueName: item.venueName,
    venueCity: item.venueCity,
    venueState: item.venueState,
    minPriceCents: item.minPriceCents,
    imageUrl: item.imageUrl,
    isFeatured: item.isFeatured,
    totalCapacity: item.totalCapacity,
    totalSold: item.totalSold,
  };
}

// ---------------------------------------------------------------------------
// Placeholder data
// ---------------------------------------------------------------------------
const ALL_PLACEHOLDER_EVENTS: EventData[] = [
  { id: '1', title: 'Neon Frequencies Festival', category: 'Music', venueName: 'Amphitheater Park', venueCity: 'Austin', startDate: new Date(Date.now() + 3600000 * 4).toISOString(), minPriceCents: 8900, totalCapacity: 500, totalSold: 450 },
  { id: '2', title: 'React Summit 2026', category: 'Tech', venueName: 'Convention Center', venueCity: 'San Francisco', startDate: new Date(Date.now() + 3600000 * 8).toISOString(), minPriceCents: 19900 },
  { id: '3', title: 'Urban Art Walk', category: 'Art', venueName: 'Downtown Gallery District', venueCity: 'New York', startDate: new Date(Date.now() + 86400000 * 2).toISOString(), minPriceCents: 0 },
  { id: '4', title: 'Street Food & Wine', category: 'Food', venueName: 'Riverside Park', venueCity: 'Chicago', startDate: new Date(Date.now() + 86400000 * 2).toISOString(), minPriceCents: 3500 },
  { id: '5', title: 'Jazz Under the Stars', category: 'Music', venueName: 'Rooftop Lounge 42', venueCity: 'New Orleans', startDate: new Date(Date.now() + 86400000 * 3).toISOString(), minPriceCents: 5500 },
  { id: '6', title: 'Hackathon: Build the Future', category: 'Tech', venueName: 'Innovation Hub', venueCity: 'Seattle', startDate: new Date(Date.now() + 86400000 * 6).toISOString(), minPriceCents: 0, totalCapacity: 200, totalSold: 185 },
  { id: '7', title: 'Midnight Cinema Classics', category: 'Art', venueName: 'The Criterion', venueCity: 'Los Angeles', startDate: new Date(Date.now() + 86400000 * 8).toISOString(), minPriceCents: 1800 },
  { id: '8', title: 'Marathon City Run 2026', category: 'Sports', venueName: 'City Hall Plaza', venueCity: 'Boston', startDate: new Date(Date.now() + 86400000 * 9).toISOString(), minPriceCents: 4500 },
  { id: '9', title: 'Farm-to-Table Dinner', category: 'Food', venueName: 'Verdana Estate', venueCity: 'Portland', startDate: new Date(Date.now() + 86400000 * 11).toISOString(), minPriceCents: 12000 },
  { id: '10', title: 'Electronic Music Night', category: 'Music', venueName: 'Club Zenith', venueCity: 'Miami', startDate: new Date(Date.now() + 86400000 * 14).toISOString(), minPriceCents: 4000, totalCapacity: 300, totalSold: 270 },
  { id: '11', title: 'Photography Masterclass', category: 'Art', venueName: 'Studio 12', venueCity: 'Denver', startDate: new Date(Date.now() + 86400000 * 15).toISOString(), minPriceCents: 7500 },
  { id: '12', title: 'Comedy Showcase', category: 'Comedy', venueName: 'The Laugh Factory', venueCity: 'Chicago', startDate: new Date(Date.now() + 86400000 * 20).toISOString(), minPriceCents: 3000 },
];

const CATEGORIES = ['All', 'Music', 'Tech', 'Art', 'Food', 'Sports', 'Comedy', 'Wellness', 'Theater'];
const CITIES = ['All Cities', 'New York', 'San Francisco', 'Chicago', 'Los Angeles', 'Austin', 'Miami', 'Seattle', 'Boston'];
const DATE_FILTERS = [
  { label: 'Any Date', value: '' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this-week' },
  { label: 'This Month', value: 'this-month' },
];

const TYPING_PLACEHOLDERS = [
  'Search events…',
  'Try "Jazz Festival"…',
  'Try "React"…',
  'Try "free events"…',
];

// ---------------------------------------------------------------------------
// Group events by time proximity
// ---------------------------------------------------------------------------
function groupEventsByTime(events: EventData[]): GroupedEvents[] {
  const now = Date.now();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const nextSaturday = new Date();
  const dayOfWeek = nextSaturday.getDay();
  const daysToSat = (6 - dayOfWeek + 7) % 7 || 7;
  nextSaturday.setDate(nextSaturday.getDate() + daysToSat);
  nextSaturday.setHours(23, 59, 59, 999);

  const nextSunday = new Date(nextSaturday);
  nextSunday.setDate(nextSunday.getDate() + 1);

  const endOfNextWeek = new Date();
  endOfNextWeek.setDate(endOfNextWeek.getDate() + 14);
  endOfNextWeek.setHours(23, 59, 59, 999);

  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  const groups: Record<TimeGroup, EventData[]> = {
    Today: [],
    'This Weekend': [],
    'Next Week': [],
    'Later This Month': [],
    Upcoming: [],
  };

  for (const event of events) {
    const dateStr = event.startDate ?? event.date ?? '';
    if (!dateStr) continue;
    const ts = new Date(dateStr).getTime();
    if (ts < now) continue;
    if (ts <= endOfToday.getTime()) {
      groups.Today.push(event);
    } else if (ts <= nextSunday.getTime()) {
      groups['This Weekend'].push(event);
    } else if (ts <= endOfNextWeek.getTime()) {
      groups['Next Week'].push(event);
    } else if (ts <= endOfMonth.getTime()) {
      groups['Later This Month'].push(event);
    } else {
      groups.Upcoming.push(event);
    }
  }

  return (Object.entries(groups) as [TimeGroup, EventData[]][])
    .filter(([, evts]) => evts.length > 0)
    .map(([label, evts]) => ({ label, events: evts }));
}

// ---------------------------------------------------------------------------
// Animated search placeholder
// ---------------------------------------------------------------------------
function useTypingPlaceholder(): string {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const current = TYPING_PLACEHOLDERS[idx];
    if (!deleting) {
      if (text.length < current.length) {
        timerRef.current = setTimeout(() => setText(current.slice(0, text.length + 1)), 70);
      } else {
        timerRef.current = setTimeout(() => setDeleting(true), 2200);
      }
    } else {
      if (text.length > 0) {
        timerRef.current = setTimeout(() => setText(text.slice(0, -1)), 35);
      } else {
        queueMicrotask(() => {
          setDeleting(false);
          setIdx((i) => (i + 1) % TYPING_PLACEHOLDERS.length);
        });
      }
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [text, deleting, idx]);

  return text;
}

// ---------------------------------------------------------------------------
// FOMO badge
// ---------------------------------------------------------------------------
function FomoBadge(): React.ReactElement {
  return (
    <span style={{
      display: 'inline-block',
      background: 'var(--accent-cta)',
      color: 'var(--bg-primary)',
      fontSize: '0.6rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: '0.15rem 0.5rem',
      borderRadius: '999px',
      verticalAlign: 'middle',
      marginLeft: '0.5rem',
      animation: 'fomoPulse 2s ease-in-out infinite',
    }}>
      Selling Fast
      <style>{`@keyframes fomoPulse { 0%,100%{opacity:1} 50%{opacity:0.7} }`}</style>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function EventsPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? 'All');
  const [dateFilter, setDateFilter] = useState(searchParams.get('dateFilter') ?? '');
  const [city, setCity] = useState('All Cities');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const placeholder = useTypingPlaceholder();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateParams = useCallback((updates: Record<string, string>): void => {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v); else next.delete(k);
    }
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent): void {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDateDropdown(false);
        setShowCityDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetchEvents(): Promise<void> {
      try {
        const params = new URLSearchParams();
        if (query) params.set('search', query);
        if (category !== 'All') params.set('category', category);
        if (dateFilter) params.set('dateFilter', dateFilter);
        if (city !== 'All Cities') params.set('city', city);

        const res = await apiClient.get<ApiEventsResponse>(`/events?${params.toString()}`);
        if (!cancelled) {
          setEvents((res.data.items ?? []).map(apiItemToEventData));
          setTotalCount(res.data.totalCount ?? 0);
        }
      } catch {
        if (!cancelled) {
          let filtered = ALL_PLACEHOLDER_EVENTS;
          if (query) filtered = filtered.filter((e) => e.title.toLowerCase().includes(query.toLowerCase()));
          if (category !== 'All') filtered = filtered.filter((e) => e.category === category);
          if (city !== 'All Cities') filtered = filtered.filter((e) => (e.venueCity ?? e.city) === city);
          setEvents(filtered);
          setTotalCount(filtered.length);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchEvents();
    return () => { cancelled = true; };
  }, [query, category, dateFilter, city]);

  const grouped = groupEventsByTime(events);

  const activeFiltersCount = [
    query,
    category !== 'All' ? category : '',
    dateFilter,
    city !== 'All Cities' ? city : '',
  ].filter(Boolean).length;

  function clearAllFilters(): void {
    setQuery('');
    setCategory('All');
    setDateFilter('');
    setCity('All Cities');
    setSearchParams(new URLSearchParams());
  }

  return (
    <div style={{ paddingTop: '64px' }}>
      <Helmet>
        <title>Events — Code829</title>
        <meta name="description" content="Browse and filter hundreds of events near you." />
      </Helmet>

      {/* Sticky filter bar */}
      <div
        style={{
          position: 'sticky',
          top: '64px',
          zIndex: 50,
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          padding: '0.75rem 1.5rem',
        }}
      >
        <div
          ref={dropdownRef}
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '0.5rem 1rem',
            flex: '1 1 220px',
            minWidth: '180px',
          }}>
            <Search size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                updateParams({ q: e.target.value });
              }}
              placeholder={placeholder}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
              }}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); updateParams({ q: '' }); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-tertiary)' }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'nowrap', overflowX: 'auto' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  updateParams({ category: cat === 'All' ? '' : cat });
                }}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '999px',
                  border: '1px solid',
                  borderColor: category === cat ? 'var(--accent-primary)' : 'var(--border)',
                  background: category === cat
                    ? 'color-mix(in srgb, var(--accent-primary) 12%, transparent)'
                    : 'var(--bg-secondary)',
                  color: category === cat ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: category === cat ? 600 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Date dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowDateDropdown((v) => !v); setShowCityDropdown(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '0.75rem',
                border: '1px solid',
                borderColor: dateFilter ? 'var(--accent-primary)' : 'var(--border)',
                background: dateFilter
                  ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)'
                  : 'var(--bg-secondary)',
                color: dateFilter ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              {DATE_FILTERS.find((d) => d.value === dateFilter)?.label ?? 'Any Date'}
              <ChevronDown size={13} />
            </button>
            {showDateDropdown && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                boxShadow: 'var(--shadow-card-hover)',
                overflow: 'hidden',
                zIndex: 60,
                minWidth: '160px',
              }}>
                {DATE_FILTERS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => {
                      setDateFilter(d.value);
                      updateParams({ dateFilter: d.value });
                      setShowDateDropdown(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.6rem 1rem',
                      border: 'none',
                      background: dateFilter === d.value
                        ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)'
                        : 'transparent',
                      color: dateFilter === d.value ? 'var(--accent-primary)' : 'var(--text-primary)',
                      fontSize: '0.875rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* City dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowCityDropdown((v) => !v); setShowDateDropdown(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '0.75rem',
                border: '1px solid',
                borderColor: city !== 'All Cities' ? 'var(--accent-primary)' : 'var(--border)',
                background: city !== 'All Cities'
                  ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)'
                  : 'var(--bg-secondary)',
                color: city !== 'All Cities' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              {city}
              <ChevronDown size={13} />
            </button>
            {showCityDropdown && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                boxShadow: 'var(--shadow-card-hover)',
                overflow: 'hidden',
                zIndex: 60,
                minWidth: '160px',
                maxHeight: '240px',
                overflowY: 'auto',
              }}>
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCity(c);
                      updateParams({ city: c === 'All Cities' ? '' : c });
                      setShowCityDropdown(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.6rem 1rem',
                      border: 'none',
                      background: city === c
                        ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)'
                        : 'transparent',
                      color: city === c ? 'var(--accent-primary)' : 'var(--text-primary)',
                      fontSize: '0.875rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear all */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '999px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              <X size={12} /> Clear ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      {/* Events content */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {!loading && totalCount > 0 && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
            {totalCount} {totalCount === 1 ? 'event' : 'events'} found
          </p>
        )}
        {loading ? (
          <div>
            <div style={{
              height: '2rem',
              width: '160px',
              background: 'var(--skeleton-base)',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
            }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        ) : grouped.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</p>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
              No events found
            </h3>
            <p>Try adjusting your filters or search query.</p>
            <button
              onClick={clearAllFilters}
              style={{
                marginTop: '1rem',
                padding: '0.6rem 1.5rem',
                borderRadius: '999px',
                background: 'var(--accent-primary)',
                color: 'var(--bg-primary)',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label} style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  {group.label}
                </h2>
                {(group.label === 'Today' || group.label === 'This Weekend') && (
                  <FomoBadge />
                )}
                <span style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-tertiary)',
                  background: 'var(--bg-tertiary)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  border: '1px solid var(--border)',
                }}>
                  {group.events.length} {group.events.length === 1 ? 'event' : 'events'}
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '1.5rem',
              }}>
                {(group.events ?? []).map((event, i) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    style={{
                      textDecoration: 'none',
                      display: 'block',
                      animationDelay: `${i * 0.08}s`,
                    }}
                  >
                    <EventCard event={event} />
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
