import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  LayoutList,
  LayoutGrid,
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
import { adminApi } from '../../services/adminApi';

// ─── Types ────────────────────────────────────────────────────────────────────

type EventStatus = 'Draft' | 'Published' | 'Cancelled' | 'Completed';
type LayoutMode = 'Grid' | 'CapacityOnly' | 'None';
type ViewMode = 'table' | 'card';

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

// ─── Status change dropdown ───────────────────────────────────────────────────

function StatusChanger({
  event,
  onStatusChanged,
}: {
  event: EventItem;
  onStatusChanged: () => void;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const transitions = STATUS_TRANSITIONS[event.status];

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (transitions.length === 0) return <></>;

  async function changeStatus(newStatus: EventStatus): Promise<void> {
    setOpen(false);
    setChanging(true);
    try {
      await adminApi.events.updateStatus(event.id, newStatus);
      toast.success(`Event marked as ${newStatus}`);
      onStatusChanged();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setChanging(false);
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={changing}
        title="Change status"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '30px',
          height: '30px',
          borderRadius: '0.375rem',
          border: '1px solid var(--border)',
          background: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          cursor: changing ? 'not-allowed' : 'pointer',
          opacity: changing ? 0.6 : 1,
          transition: 'background 0.15s',
        }}
      >
        <ChevronDown size={13} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.25rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            boxShadow: 'var(--shadow-card-hover)',
            zIndex: 100,
            minWidth: '130px',
            overflow: 'hidden',
          }}
        >
          {transitions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void changeStatus(s)}
              style={{
                width: '100%',
                padding: '0.5rem 0.875rem',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'none';
              }}
            >
              Mark as {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow(): React.ReactElement {
  return (
    <tr>
      {[180, 110, 140, 80, 60, 70, 60].map((w, i) => (
        <td key={i} style={{ padding: '0.875rem 1rem' }}>
          <div
            style={{
              height: '14px',
              width: `${w}px`,
              maxWidth: '100%',
              borderRadius: '0.25rem',
              background: 'var(--bg-tertiary)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard(): React.ReactElement {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '120px',
          background: 'var(--bg-tertiary)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        <div style={{ height: '18px', width: '70%', borderRadius: '0.25rem', background: 'var(--bg-tertiary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: '13px', width: '50%', borderRadius: '0.25rem', background: 'var(--bg-tertiary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: '13px', width: '40%', borderRadius: '0.25rem', background: 'var(--bg-tertiary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
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
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
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

      const res = await adminApi.events.list<PaginatedResponse>(params);
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
      await adminApi.events.delete(deleteTarget.id);
      toast.success(`"${deleteTarget.title}" deleted`);
      setDeleteTarget(null);
      void fetchEvents();
    } catch {
      toast.error('Failed to delete event');
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate(startDate: string, endDate: string): Promise<void> {
    if (!duplicateTarget) return;
    setDuplicating(true);
    try {
      await adminApi.events.duplicate(duplicateTarget.id, startDate, endDate);
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
          to="/admin/events/new"
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
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
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

        {/* View toggle */}
        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: 'auto' }}>
          {(['table', 'card'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              aria-label={mode === 'table' ? 'Table view' : 'Grid view'}
              aria-pressed={viewMode === mode}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '0.375rem',
                border: '1px solid var(--border)',
                background: viewMode === mode ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: viewMode === mode ? 'var(--bg-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {mode === 'table' ? <LayoutList size={16} /> : <LayoutGrid size={16} />}
            </button>
          ))}
        </div>
      </div>

      {/* Table view */}
      {viewMode === 'table' && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="c829-table-scroll" style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: 'var(--font-body)',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {['Title', 'Date', 'Venue', 'Category', 'Layout', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: h === 'Actions' ? 'center' : 'left',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                  : data?.items.length === 0
                  ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          padding: '3rem',
                          textAlign: 'center',
                          color: 'var(--text-tertiary)',
                          fontSize: '0.9rem',
                        }}
                      >
                        No events match your filters.
                      </td>
                    </tr>
                  )
                  : data?.items.map((event) => (
                    <tr
                      key={event.id}
                      onClick={() => navigate(`/admin/events/${event.id}`)}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                      }}
                    >
                      <td
                        style={{
                          padding: '0.875rem 1rem',
                          color: 'var(--text-primary)',
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          maxWidth: '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {event.title}
                      </td>
                      <td
                        style={{
                          padding: '0.875rem 1rem',
                          color: 'var(--text-secondary)',
                          fontSize: '0.8125rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDate(event.startDate)}
                      </td>
                      <td
                        style={{
                          padding: '0.875rem 1rem',
                          color: 'var(--text-secondary)',
                          fontSize: '0.8125rem',
                          maxWidth: '160px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {event.venue ? `${event.venue.name}` : '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <CategoryPill category={event.category} />
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <LayoutIcon mode={event.layoutMode} />
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <StatusBadge status={event.status} />
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: '0.375rem', alignItems: 'center' }}>
                          <StatusChanger event={event} onStatusChanged={() => void fetchEvents()} />
                          {event.status === 'Completed' || event.status === 'Cancelled' ? (
                            <span
                              title="Cannot edit completed or cancelled events"
                              className="c829-table-action-btn"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '30px',
                                height: '30px',
                                borderRadius: '0.375rem',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-tertiary)',
                                opacity: 0.4,
                                cursor: 'not-allowed',
                              }}
                            >
                              <Pencil size={13} />
                            </span>
                          ) : (
                            <Link
                              to={`/admin/events/${event.id}/edit`}
                              aria-label={`Edit ${event.title}`}
                              className="c829-table-action-btn"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '30px',
                                height: '30px',
                                borderRadius: '0.375rem',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-tertiary)',
                                color: 'var(--accent-primary)',
                                textDecoration: 'none',
                                transition: 'background 0.15s',
                              }}
                            >
                              <Pencil size={13} />
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => setDuplicateTarget(event)}
                            aria-label={`Duplicate ${event.title}`}
                            title="Duplicate"
                            className="c829-table-action-btn"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '30px',
                              height: '30px',
                              borderRadius: '0.375rem',
                              border: '1px solid var(--border)',
                              background: 'var(--bg-tertiary)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              transition: 'background 0.15s',
                            }}
                          >
                            <Copy size={13} />
                          </button>
                          {event.status === 'Draft' && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(event)}
                              aria-label={`Delete ${event.title}`}
                              className="c829-table-action-btn"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '30px',
                                height: '30px',
                                borderRadius: '0.375rem',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-tertiary)',
                                color: 'var(--color-error)',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Card view */}
      {viewMode === 'card' && (
        <div>
          {loading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : data?.items.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                padding: '3rem',
                background: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border)',
                fontSize: '0.9rem',
              }}
            >
              No events match your filters.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
              }}
            >
              {data?.items.map((event) => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/admin/events/${event.id}`)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'box-shadow 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card-hover)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)';
                  }}
                >
                  {/* Banner / gradient header */}
                  <div
                    style={{
                      height: '110px',
                      background: event.imageUrl
                        ? `linear-gradient(to bottom, color-mix(in srgb, var(--accent-primary) 30%, transparent), color-mix(in srgb, var(--bg-primary) 80%, transparent)), url(${event.imageUrl}) center/cover no-repeat`
                        : 'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 40%, transparent), color-mix(in srgb, var(--accent-secondary, var(--accent-primary)) 20%, var(--bg-tertiary)))',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: '0.625rem 0.875rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                      <StatusBadge status={event.status} />
                      <span style={{ marginLeft: 'auto' }}>
                        <LayoutIcon mode={event.layoutMode} />
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {event.title}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <Calendar size={13} />
                      {formatDate(event.startDate)}
                    </div>

                    {event.venue && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={13} />
                        {event.venue.name}
                      </div>
                    )}

                    <CategoryPill category={event.category} />

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                      {event.status === 'Completed' || event.status === 'Cancelled' ? (
                        <span
                          title="Cannot edit completed or cancelled events"
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            padding: '0.4rem',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-tertiary)',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            opacity: 0.4,
                            cursor: 'not-allowed',
                          }}
                        >
                          <Pencil size={13} />
                          Edit
                        </span>
                      ) : (
                        <Link
                          to={`/admin/events/${event.id}/edit`}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            padding: '0.4rem',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--accent-primary)',
                            textDecoration: 'none',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            transition: 'background 0.15s',
                          }}
                        >
                          <Pencil size={13} />
                          Edit
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => setDuplicateTarget(event)}
                        title="Duplicate"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.6rem',
                          borderRadius: '0.375rem',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontFamily: 'var(--font-body)',
                          transition: 'background 0.15s',
                        }}
                      >
                        <Copy size={13} />
                      </button>
                      {event.status === 'Draft' && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(event)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            padding: '0.4rem',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--color-error)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            fontFamily: 'var(--font-body)',
                            transition: 'background 0.15s',
                          }}
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
