import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Grid3X3,
  Users,
  Ticket,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  MapPin,
  X,
  Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRoleContext } from '../../lib/roleContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type EventStatus = 'Draft' | 'Published' | 'Cancelled' | 'Completed';
type LayoutMode = 'Grid' | 'CapacityOnly' | 'None';

interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: EventStatus;
  category: string;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  isFeatured: boolean;
  layoutMode: LayoutMode;
  maxCapacity: number | null;
  platformFeePercent: number;
  publishedAt: string | null;
  venueId: string;
  venue: { id: string; name: string; city: string; state: string } | null;
  organizerId: string | null;
  organizerName: string | null;
  createdAt: string;
}

interface PaginatedResponse {
  items: EventItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  Draft: ['Published'],
  Published: ['Cancelled', 'Completed'],
  Cancelled: [],
  Completed: [],
};

const CATEGORIES = ['Music', 'Business', 'Social', 'Dining', 'Tech', 'Arts', 'Family', 'Sports'];
const PAGE_SIZE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: EventStatus }): React.ReactElement {
  const styles: Record<EventStatus, { bg: string; color: string }> = {
    Draft: {
      bg: 'color-mix(in srgb, var(--text-tertiary) 15%, transparent)',
      color: 'var(--text-tertiary)',
    },
    Published: {
      bg: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
      color: 'var(--color-success)',
    },
    Cancelled: {
      bg: 'color-mix(in srgb, var(--color-error) 15%, transparent)',
      color: 'var(--color-error)',
    },
    Completed: {
      bg: 'color-mix(in srgb, var(--color-info) 15%, transparent)',
      color: 'var(--color-info)',
    },
  };

  const s = styles[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.2rem 0.6rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: s.bg,
        color: s.color,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: s.color,
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}

// ─── Category pill ────────────────────────────────────────────────────────────

function CategoryPill({ category }: { category: string }): React.ReactElement {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.55rem',
        borderRadius: '0.375rem',
        fontSize: '0.75rem',
        fontWeight: 500,
        background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
        color: 'var(--accent-primary)',
        border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)',
        whiteSpace: 'nowrap',
      }}
    >
      {category}
    </span>
  );
}

// ─── Layout icon ──────────────────────────────────────────────────────────────

function LayoutIcon({ mode }: { mode: LayoutMode }): React.ReactElement {
  const icon =
    mode === 'Grid'
      ? <Grid3X3 size={15} />
      : mode === 'CapacityOnly'
      ? <Users size={15} />
      : <Ticket size={15} />;

  const label =
    mode === 'Grid' ? 'Assigned' : mode === 'CapacityOnly' ? 'GA' : 'Tickets';

  return (
    <span
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
      }}
    >
      {icon}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonEventAccordion(): React.ReactElement {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        borderRight: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        borderLeft: '4px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ height: '14px', width: '50%', borderRadius: '4px', background: 'var(--bg-tertiary)' }} />
        <div style={{ height: '11px', width: '30%', borderRadius: '4px', background: 'var(--bg-tertiary)' }} />
      </div>
      <div style={{ height: '20px', width: '70px', borderRadius: '999px', background: 'var(--bg-tertiary)', flexShrink: 0 }} />
    </div>
  );
}

// ─── Duplicate dialog ─────────────────────────────────────────────────────────

function DuplicateDialog({
  event,
  onConfirm,
  onCancel,
  duplicating,
}: {
  event: EventItem;
  onConfirm: (startDate: string, endDate: string) => void;
  onCancel: () => void;
  duplicating: boolean;
}): React.ReactElement {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const isValid = startDate.length > 0 && endDate.length > 0 && endDate >= startDate;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'color-mix(in srgb, var(--bg-primary) 60%, transparent)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
          padding: '1.5rem',
          maxWidth: '440px',
          width: '100%',
          boxShadow: 'var(--shadow-card-hover)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Duplicate Event
          </h2>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.125rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
          Create a copy of{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{event.title}</strong>. Choose dates for
          the new event.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.25rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.375rem',
              }}
            >
              New Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.875rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.375rem',
              }}
            >
              New End Date *
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              style={{
                width: '100%',
                padding: '0.55rem 0.875rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={duplicating}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => isValid && onConfirm(startDate, endDate)}
            disabled={!isValid || duplicating}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: isValid ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              color: isValid ? 'var(--bg-primary)' : 'var(--text-tertiary)',
              cursor: !isValid || duplicating ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              fontWeight: 600,
              opacity: duplicating ? 0.7 : 1,
            }}
          >
            {duplicating ? 'Duplicating…' : 'Duplicate Event'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete dialog ────────────────────────────────────────────────────────────

function DeleteDialog({
  event,
  onConfirm,
  onCancel,
  deleting,
}: {
  event: EventItem;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}): React.ReactElement {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'color-mix(in srgb, var(--bg-primary) 60%, transparent)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
          padding: '1.5rem',
          maxWidth: '420px',
          width: '100%',
          boxShadow: 'var(--shadow-card-hover)',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 0.5rem',
          }}
        >
          Delete Event
        </h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.25rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Are you sure you want to delete{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{event.title}</strong>? This action
          cannot be undone. Only Draft events without bookings can be deleted.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={deleting}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'var(--color-error)',
              color: 'var(--bg-primary)',
              cursor: deleting ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              fontWeight: 600,
              opacity: deleting ? 0.6 : 1,
            }}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EventsListPage(): React.ReactElement {
  const { api, basePath } = useRoleContext();
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState<EventItem | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchEvents = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, pageSize: PAGE_SIZE };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;

      const res = await api.events.list<PaginatedResponse>(params);
      setData(res.data);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, categoryFilter]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  async function handleDelete(): Promise<void> {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.events.delete(deleteTarget.id);
      toast.success(`"${deleteTarget.title}" deleted`);
      setDeleteTarget(null);
      void fetchEvents();
    } catch {
      toast.error('Failed to delete event');
    } finally {
      setDeleting(false);
    }
  }

  async function handleStatusChange(eventId: string, newStatus: EventStatus): Promise<void> {
    try {
      await api.events.updateStatus(eventId, newStatus);
      toast.success(`Event marked as ${newStatus}`);
      void fetchEvents();
    } catch {
      toast.error('Failed to update status');
    }
  }

  async function handleDuplicate(startDate: string, endDate: string): Promise<void> {
    if (!duplicateTarget) return;
    setDuplicating(true);
    try {
      await api.events.duplicate(duplicateTarget.id, startDate, endDate);
      toast.success(`"${duplicateTarget.title}" duplicated`);
      setDuplicateTarget(null);
      void fetchEvents();
    } catch {
      toast.error('Failed to duplicate event');
    } finally {
      setDuplicating(false);
    }
  }

  const statusTabs: (EventStatus | 'All')[] = ['All', 'Draft', 'Published', 'Completed', 'Cancelled'];

  const startItem = data ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endItem = data ? Math.min(page * PAGE_SIZE, data.totalCount) : 0;

  const hasNextPage = data ? page < data.totalPages : false;
  const hasPrevPage = page > 1;

  return (
    <div>
      {/* Header */}
      <div
        className="c829-page-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          Events
        </h1>
        <Link
          to={`${basePath}/events/new`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1.125rem',
            borderRadius: '0.5rem',
            background: 'var(--accent-primary)',
            color: 'var(--bg-primary)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            transition: 'opacity 0.2s',
          }}
        >
          <Plus size={16} />
          Create Event
        </Link>
      </div>

      {/* Status tabs */}
      <div
        className="c829-status-tabs"
        style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: '1rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '0.625rem',
          padding: '0.25rem',
          flexWrap: 'wrap',
        }}
      >
        {statusTabs.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setStatusFilter(s); setPage(1); }}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: '0.4rem',
              border: 'none',
              background: statusFilter === s ? 'var(--accent-primary)' : 'transparent',
              color: statusFilter === s ? 'var(--bg-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              fontWeight: statusFilter === s ? 600 : 400,
              transition: 'background 0.15s, color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div
        className="c829-filter-row"
        style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '0.875rem',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '0' }}>
          <input
            type="text"
            placeholder="Search events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 2rem 0.5rem 0.875rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-tertiary)',
                padding: '0.125rem',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category */}
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          style={{
            padding: '0.5rem 0.875rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: categoryFilter ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

      </div>

      {/* Accordion list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonEventAccordion key={i} />)
        ) : data?.items.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '3rem 1.5rem',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              fontSize: '0.875rem',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            No events match your filters.
          </div>
        ) : (
          data?.items.map((event) => {
            const isExpanded = expandedId === event.id;
            const statusColors: Record<EventStatus, string> = {
              Draft: 'var(--text-tertiary)',
              Published: 'var(--color-success)',
              Cancelled: 'var(--color-error)',
              Completed: 'var(--color-info)',
            };
            const borderColor = statusColors[event.status];
            const canEdit = event.status !== 'Completed' && event.status !== 'Cancelled';

            return (
              <div
                key={event.id}
                style={{
                  background: 'var(--bg-secondary)',
                  borderTop: `1px solid ${isExpanded ? borderColor : 'var(--border)'}`,
                  borderRight: `1px solid ${isExpanded ? borderColor : 'var(--border)'}`,
                  borderBottom: `1px solid ${isExpanded ? borderColor : 'var(--border)'}`,
                  borderLeft: `4px solid ${borderColor}`,
                  borderRadius: '0.75rem',
                  boxShadow: isExpanded ? `0 0 0 1px ${borderColor}22` : 'var(--shadow-card)',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              >
                {/* Card header — click to expand */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : event.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    padding: '0.875rem 1.125rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {/* Title + date subtitle */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {event.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={11} />
                      {formatDate(event.startDate)}
                      {event.venue && (
                        <>
                          <span style={{ opacity: 0.4 }}>·</span>
                          <MapPin size={11} />
                          {event.venue.name}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <StatusBadge status={event.status} />

                  {/* Chevron */}
                  <div
                    style={{
                      color: 'var(--text-tertiary)',
                      flexShrink: 0,
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.22s ease',
                    }}
                  >
                    <ChevronDown size={18} />
                  </div>
                </button>

                {/* Expanded detail — two-section panel */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>

                    {/* Section 1: metadata chips */}
                    <div
                      style={{
                        padding: '0.75rem 1.125rem',
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        background: 'color-mix(in srgb, var(--bg-tertiary) 50%, var(--bg-secondary))',
                      }}
                    >
                      <CategoryPill category={event.category} />
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          fontSize: '0.73rem',
                          color: 'var(--text-secondary)',
                          fontWeight: 500,
                        }}
                      >
                        <LayoutIcon mode={event.layoutMode} />
                        {event.layoutMode === 'Grid' ? 'Assigned seating' : event.layoutMode === 'CapacityOnly' ? 'General admission' : 'Tickets only'}
                      </div>
                      {event.maxCapacity && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            fontSize: '0.73rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 500,
                          }}
                        >
                          <Users size={11} />
                          {event.maxCapacity.toLocaleString()} cap
                        </div>
                      )}
                    </div>

                    {/* Section 2: action buttons */}
                    <div
                      style={{
                        padding: '0.75rem 1.125rem',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        background: 'var(--bg-secondary)',
                        borderRadius: '0 0 0.65rem 0.65rem',
                      }}
                    >
                      {/* Status transitions — inline buttons, no dropdown */}
                      {STATUS_TRANSITIONS[event.status].map((nextStatus) => {
                        const isPublish = nextStatus === 'Published';
                        const isCancel = nextStatus === 'Cancelled';
                        const label = isPublish ? 'Publish' : isCancel ? 'Cancel event' : 'Mark complete';
                        return (
                          <button
                            key={nextStatus}
                            type="button"
                            onClick={() => void handleStatusChange(event.id, nextStatus)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.4rem 0.875rem',
                              borderRadius: '0.5rem',
                              border: `1px solid ${isPublish ? 'var(--color-success)' : isCancel ? 'color-mix(in srgb, var(--color-error) 40%, transparent)' : 'var(--border)'}`,
                              background: isPublish
                                ? 'color-mix(in srgb, var(--color-success) 12%, var(--bg-secondary))'
                                : isCancel
                                ? 'color-mix(in srgb, var(--color-error) 8%, var(--bg-secondary))'
                                : 'var(--bg-secondary)',
                              color: isPublish ? 'var(--color-success)' : isCancel ? 'var(--color-error)' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              fontFamily: 'var(--font-body)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}

                      <div style={{ flex: 1, minWidth: '0.5rem' }} />

                      {/* Primary: Manage */}
                      <Link
                        to={`${basePath}/events/${event.id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          background: 'var(--accent-primary)',
                          color: 'var(--bg-primary)',
                          textDecoration: 'none',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          fontFamily: 'var(--font-body)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Manage
                      </Link>

                      {/* Edit */}
                      {canEdit ? (
                        <Link
                          to={`${basePath}/events/${event.id}/edit`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.4rem 0.875rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            fontFamily: 'var(--font-body)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Pencil size={13} />
                          Edit
                        </Link>
                      ) : (
                        <span
                          title="Cannot edit completed or cancelled events"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.4rem 0.875rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-tertiary)',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            opacity: 0.4,
                            cursor: 'not-allowed',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Pencil size={13} />
                          Edit
                        </span>
                      )}

                      {/* Duplicate */}
                      <button
                        type="button"
                        onClick={() => setDuplicateTarget(event)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.875rem',
                          borderRadius: '0.5rem',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          fontFamily: 'var(--font-body)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Copy size={13} />
                        Duplicate
                      </button>

                      {/* Delete — Draft only */}
                      {event.status === 'Draft' && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(event)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.4rem 0.875rem',
                            borderRadius: '0.5rem',
                            border: '1px solid color-mix(in srgb, var(--color-error) 40%, transparent)',
                            background: 'color-mix(in srgb, var(--color-error) 8%, var(--bg-secondary))',
                            color: 'var(--color-error)',
                            cursor: 'pointer',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            fontFamily: 'var(--font-body)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && data && data.totalCount > 0 && (
        <div
          className="c829-pagination"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '1rem',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
            Showing {startItem}–{endItem} of {data.totalCount}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={!hasPrevPage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.875rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: hasPrevPage ? 'var(--text-primary)' : 'var(--text-tertiary)',
                cursor: hasPrevPage ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                opacity: hasPrevPage ? 1 : 0.5,
              }}
            >
              <ChevronLeft size={15} />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNextPage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.875rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: hasNextPage ? 'var(--text-primary)' : 'var(--text-tertiary)',
                cursor: hasNextPage ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                opacity: hasNextPage ? 1 : 0.5,
              }}
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      {deleteTarget && (
        <DeleteDialog
          event={deleteTarget}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      {duplicateTarget && (
        <DuplicateDialog
          event={duplicateTarget}
          onConfirm={(startDate, endDate) => void handleDuplicate(startDate, endDate)}
          onCancel={() => setDuplicateTarget(null)}
          duplicating={duplicating}
        />
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
    </div>
  );
}
