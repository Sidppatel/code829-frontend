import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, LayoutList, LayoutGrid, Pencil, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../lib/axios';
import { SkeletonLine } from '../../components/Skeleton';

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  capacity: number;
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

type ViewMode = 'table' | 'card';
type StatusFilter = 'all' | 'active' | 'inactive';

const PAGE_SIZE = 20;

// ─── Skeleton rows / cards ──────────────────────────────────────────────────

function SkeletonRow(): React.ReactElement {
  return (
    <tr>
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} style={{ padding: '0.875rem 1rem' }}>
          <SkeletonLine className={i === 1 ? 'w-40' : i === 5 ? 'w-16' : 'w-24'} />
        </td>
      ))}
    </tr>
  );
}

function SkeletonVenueCard(): React.ReactElement {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <SkeletonLine className="w-48 h-6" />
      <SkeletonLine className="w-full h-4" />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <SkeletonLine className="w-20 h-5" />
        <SkeletonLine className="w-16 h-5" />
      </div>
    </div>
  );
}

// ─── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ isActive }: { isActive: boolean }): React.ReactElement {
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
        background: isActive
          ? 'color-mix(in srgb, var(--color-success) 15%, transparent)'
          : 'color-mix(in srgb, var(--color-error) 15%, transparent)',
        color: isActive ? 'var(--color-success)' : 'var(--color-error)',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: isActive ? 'var(--color-success)' : 'var(--color-error)',
        }}
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
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
  const [viewMode, setViewMode] = useState<ViewMode>('table');
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

      const res = await apiClient.get<PaginatedResponse>('/admin/venues', { params });
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

  async function handleDelete(): Promise<void> {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/venues/${deleteTarget.id}`);
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
            minWidth: '200px',
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

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
          {(['table', 'card'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
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
          <div style={{ overflowX: 'auto' }}>
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
                  {['Name', 'City / State', 'Capacity', 'Status', 'Actions'].map((h) => (
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
                        colSpan={5}
                        style={{
                          padding: '3rem',
                          textAlign: 'center',
                          color: 'var(--text-tertiary)',
                          fontSize: '0.9rem',
                        }}
                      >
                        No venues match your filters.
                      </td>
                    </tr>
                  )
                  : data?.items.map((venue) => (
                    <tr
                      key={venue.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s',
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
                        {venue.name}
                      </td>
                      <td
                        style={{
                          padding: '0.875rem 1rem',
                          color: 'var(--text-secondary)',
                          fontSize: '0.875rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {venue.city}, {venue.state}
                      </td>
                      <td
                        style={{
                          padding: '0.875rem 1rem',
                          color: 'var(--text-secondary)',
                          fontSize: '0.875rem',
                        }}
                      >
                        {venue.capacity?.toLocaleString() ?? '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <StatusBadge isActive={venue.isActive} />
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '0.375rem', alignItems: 'center' }}>
                          <Link
                            to={`/admin/venues/${venue.id}/edit`}
                            aria-label={`Edit ${venue.name}`}
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
                          <button
                            onClick={() => setDeleteTarget(venue)}
                            aria-label={`Delete ${venue.name}`}
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
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonVenueCard key={i} />
              ))}
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
              No venues match your filters.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
              }}
            >
              {data?.items.map((venue) => (
                <div
                  key={venue.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                    transition: 'box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card-hover)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)';
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {venue.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {venue.address}, {venue.city}, {venue.state} {venue.zipCode}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {venue.capacity > 0 && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border)',
                          borderRadius: '0.375rem',
                          padding: '0.15rem 0.5rem',
                        }}
                      >
                        Cap: {venue.capacity.toLocaleString()}
                      </span>
                    )}
                    <StatusBadge isActive={venue.isActive} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <Link
                      to={`/admin/venues/${venue.id}/edit`}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem',
                        borderRadius: '0.375rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--accent-primary)',
                        textDecoration: 'none',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        transition: 'background 0.15s',
                      }}
                    >
                      <Pencil size={13} />
                      Edit
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(venue)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem',
                        borderRadius: '0.375rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--color-error)',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        transition: 'background 0.15s',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
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
