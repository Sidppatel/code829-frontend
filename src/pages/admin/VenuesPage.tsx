import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight, ChevronDown, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/adminApi';

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  description: string;
  imageUrl: string;
  phone: string;
  website: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
}

interface PaginatedResponse {
  items: Venue[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

type StatusFilter = 'all' | 'active' | 'inactive';

const PAGE_SIZE = 20;

// ─── Skeleton card ───────────────────────────────────────────────────────────

function SkeletonVenueAccordion(): React.ReactElement {
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
      <div style={{ width: '38px', height: '38px', borderRadius: '0.5rem', background: 'var(--bg-tertiary)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ height: '14px', width: '45%', borderRadius: '4px', background: 'var(--bg-tertiary)' }} />
        <div style={{ height: '11px', width: '30%', borderRadius: '4px', background: 'var(--bg-tertiary)' }} />
      </div>
      <div style={{ height: '20px', width: '64px', borderRadius: '999px', background: 'var(--bg-tertiary)', flexShrink: 0 }} />
    </div>
  );
}

// ─── Status badge ────────────────────────────────────────────────────────────

function StatusToggle({ isActive, onToggle }: { isActive: boolean; onToggle: () => void }): React.ReactElement {
  return (
    <button
      type="button"
      title={isActive ? 'Click to disable' : 'Click to enable'}
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.25rem 0.625rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: isActive
          ? 'color-mix(in srgb, var(--color-success) 15%, transparent)'
          : 'var(--bg-tertiary)',
        color: isActive ? 'var(--color-success)' : 'var(--text-tertiary)',
        border: `1px solid ${isActive ? 'var(--color-success)' : 'var(--border)'}`,
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        width: '28px', height: '16px', borderRadius: '8px',
        background: isActive ? 'var(--color-success)' : 'var(--border)',
        position: 'relative', transition: 'background 0.2s',
      }}>
        <div style={{
          width: '12px', height: '12px', borderRadius: '50%',
          background: 'var(--bg-primary)',
          position: 'absolute', top: '2px',
          left: isActive ? '14px' : '2px',
          transition: 'left 0.2s',
        }} />
      </div>
      {isActive ? 'Active' : 'Disabled'}
    </button>
  );
}

// ─── Confirm delete dialog ───────────────────────────────────────────────────

function DeleteDialog({
  venue,
  onConfirm,
  onCancel,
  deleting,
}: {
  venue: Venue;
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
          Delete Venue
        </h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.25rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{venue.name}</strong>? This will
          mark the venue as inactive.
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

// ─── Main component ──────────────────────────────────────────────────────────

export default function VenuesPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deleteTarget, setDeleteTarget] = useState<Venue | null>(null);
  const [deleting, setDeleting] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  const fetchVenues = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, pageSize: PAGE_SIZE };
      if (debouncedSearch) params.search = debouncedSearch;
      if (cityFilter) params.city = cityFilter;
      if (statusFilter !== 'all') params.isActive = statusFilter === 'active' ? 'true' : 'false';

      const res = await adminApi.venues.list<PaginatedResponse>(params);
      setData(res.data);
    } catch {
      toast.error('Failed to load venues');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, cityFilter, statusFilter]);

  useEffect(() => {
    void fetchVenues();
  }, [fetchVenues]);

  // Unique cities from loaded items
  const allCities = data
    ? Array.from(new Set(data.items.map((v) => v.city).filter(Boolean))).sort()
    : [];

  async function handleToggleVenueActive(venueId: string, active: boolean): Promise<void> {
    try {
      if (active) {
        await adminApi.venues.update(venueId, { isActive: true });
      } else {
        await adminApi.venues.delete(venueId);
      }
      toast.success(active ? 'Venue enabled' : 'Venue disabled');
      void fetchVenues();
    } catch {
      toast.error('Failed to update venue');
    }
  }

  async function handleDelete(): Promise<void> {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.venues.delete(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      void fetchVenues();
    } catch {
      toast.error('Failed to delete venue');
    } finally {
      setDeleting(false);
    }
  }

  // Active filter chips
  const activeFilters: { label: string; onRemove: () => void }[] = [];
  if (debouncedSearch) activeFilters.push({ label: `Search: ${debouncedSearch}`, onRemove: () => { setSearch(''); setDebouncedSearch(''); } });
  if (cityFilter) activeFilters.push({ label: `City: ${cityFilter}`, onRemove: () => setCityFilter('') });
  if (statusFilter !== 'all') activeFilters.push({ label: `Status: ${statusFilter}`, onRemove: () => setStatusFilter('all') });

  const startItem = data ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endItem = data ? Math.min(page * PAGE_SIZE, data.totalCount) : 0;

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
          Venues
        </h1>
        <Link
          to="/admin/venues/new"
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
          Add Venue
        </Link>
      </div>

      {/* Filters */}
      <div
        className="c829-filter-row"
        style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="Search venues…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '0.5rem 0.875rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            outline: 'none',
          }}
        />

        {/* City filter */}
        <select
          value={cityFilter}
          onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
          style={{
            padding: '0.5rem 0.875rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: cityFilter ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <option value="">All Cities</option>
          {allCities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
          style={{
            padding: '0.5rem 0.875rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {activeFilters.map((f) => (
            <span
              key={f.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.625rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 500,
                background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
                color: 'var(--accent-primary)',
                border: '1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)',
              }}
            >
              {f.label}
              <button
                onClick={f.onRemove}
                aria-label={`Remove filter ${f.label}`}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--accent-primary)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Accordion list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonVenueAccordion key={i} />)
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
            No venues match your filters.
          </div>
        ) : (
          data?.items.map((venue) => {
            const isExpanded = expandedId === venue.id;
            const initials = venue.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

            return (
              <div
                key={venue.id}
                style={{
                  background: 'var(--bg-secondary)',
                  borderTop: `1px solid ${isExpanded ? 'var(--accent-primary)' : 'var(--border)'}`,
                  borderRight: `1px solid ${isExpanded ? 'var(--accent-primary)' : 'var(--border)'}`,
                  borderBottom: `1px solid ${isExpanded ? 'var(--accent-primary)' : 'var(--border)'}`,
                  borderLeft: `4px solid ${venue.isActive ? 'var(--accent-primary)' : 'var(--border)'}`,
                  borderRadius: '0.75rem',
                  boxShadow: isExpanded ? '0 0 0 1px color-mix(in srgb, var(--accent-primary) 20%, transparent)' : 'var(--shadow-card)',
                  opacity: venue.isActive ? 1 : 0.55,
                  transition: 'border-color 0.2s, box-shadow 0.2s, opacity 0.2s',
                  overflow: 'hidden',
                }}
              >
                {/* Card header */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : venue.id)}
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
                  {/* Letter avatar */}
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '0.5rem',
                      background: 'color-mix(in srgb, var(--accent-primary) 18%, var(--bg-tertiary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'var(--accent-primary)',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      letterSpacing: '-0.02em',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {initials}
                  </div>

                  {/* Name + city */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textDecoration: venue.isActive ? 'none' : 'line-through',
                      }}
                    >
                      {venue.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={11} />
                      {venue.city}, {venue.state}
                    </div>
                  </div>

                  {/* Status pill */}
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '999px',
                      background: venue.isActive
                        ? 'color-mix(in srgb, var(--color-success) 15%, transparent)'
                        : 'var(--bg-tertiary)',
                      color: venue.isActive ? 'var(--color-success)' : 'var(--text-tertiary)',
                      border: `1px solid ${venue.isActive ? 'var(--color-success)' : 'var(--border)'}`,
                      flexShrink: 0,
                    }}
                  >
                    {venue.isActive ? 'Active' : 'Disabled'}
                  </span>

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

                {/* Expanded detail */}
                {isExpanded && (
                  <div
                    style={{
                      borderTop: '1px solid var(--border)',
                      padding: '0.875rem 1.125rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      alignItems: 'center',
                      background: 'color-mix(in srgb, var(--bg-tertiary) 60%, var(--bg-secondary))',
                    }}
                  >
                    {/* Address */}
                    {venue.address && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <MapPin size={13} style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} />
                        {venue.address}, {venue.city}, {venue.state} {venue.zipCode}
                      </div>
                    )}

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Status toggle */}
                    <StatusToggle
                      isActive={venue.isActive}
                      onToggle={() => void handleToggleVenueActive(venue.id, !venue.isActive)}
                    />

                    {/* Edit */}
                    {venue.isActive ? (
                      <Link
                        to={`/admin/venues/${venue.id}/edit`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.4rem 0.875rem',
                          borderRadius: '0.5rem',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--accent-primary)',
                          textDecoration: 'none',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          fontFamily: 'var(--font-body)',
                          transition: 'border-color 0.15s',
                        }}
                      >
                        <Pencil size={13} />
                        Edit
                      </Link>
                    ) : (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.4rem 0.875rem',
                          borderRadius: '0.5rem',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-tertiary)',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          opacity: 0.45,
                          cursor: 'not-allowed',
                        }}
                      >
                        <Pencil size={13} />
                        Edit
                      </span>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      disabled={!venue.isActive}
                      onClick={venue.isActive ? () => setDeleteTarget(venue) : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.4rem 0.875rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${venue.isActive ? 'var(--color-error)' : 'var(--border)'}`,
                        background: venue.isActive
                          ? 'color-mix(in srgb, var(--color-error) 10%, var(--bg-secondary))'
                          : 'var(--bg-tertiary)',
                        color: venue.isActive ? 'var(--color-error)' : 'var(--text-tertiary)',
                        cursor: venue.isActive ? 'pointer' : 'not-allowed',
                        opacity: venue.isActive ? 1 : 0.45,
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        fontFamily: 'var(--font-body)',
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
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
              onClick={() => setPage((p) => p - 1)}
              disabled={!data.hasPreviousPage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.875rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: data.hasPreviousPage ? 'var(--text-primary)' : 'var(--text-tertiary)',
                cursor: data.hasPreviousPage ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                opacity: data.hasPreviousPage ? 1 : 0.5,
              }}
            >
              <ChevronLeft size={15} />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.hasNextPage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.875rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: data.hasNextPage ? 'var(--text-primary)' : 'var(--text-tertiary)',
                cursor: data.hasNextPage ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                opacity: data.hasNextPage ? 1 : 0.5,
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
          venue={deleteTarget}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
