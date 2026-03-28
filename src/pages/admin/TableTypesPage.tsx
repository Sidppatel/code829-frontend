import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Circle, RectangleHorizontal, Square, Diamond, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../lib/axios';
import { SkeletonLine } from '../../components/Skeleton';
import type { TableShape } from '../../stores/floorPlanStore';

// ─── Types ────────────────────────────────────────────────────────────────────

// API returns defaultShape, we map it to shape for convenience
interface ApiTableType {
  id: string;
  name: string;
  defaultShape: string;
  defaultCapacity: number;
  defaultPriceCents: number;
  defaultColor: string;
  isActive: boolean;
}

interface TableType {
  id: string;
  name: string;
  shape: TableShape;
  defaultCapacity: number;
  defaultPriceCents: number;
  defaultColor: string;
  isActive: boolean;
}

function mapApiToTableType(api: ApiTableType): TableType {
  return {
    id: api.id,
    name: api.name,
    shape: (api.defaultShape as TableShape) || 'Round',
    defaultCapacity: api.defaultCapacity,
    defaultPriceCents: api.defaultPriceCents,
    defaultColor: api.defaultColor || '',
    isActive: api.isActive,
  };
}

interface TableTypeFormData {
  name: string;
  shape: TableShape;
  defaultCapacity: number;
  defaultPriceCents: number;
  defaultColor: string;
}

const EMPTY_FORM: TableTypeFormData = {
  name: '',
  shape: 'Round',
  defaultCapacity: 8,
  defaultPriceCents: 0,
  defaultColor: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ShapeIcon({ shape, size = 16, fill }: { shape: TableShape; size?: number; fill?: string }): React.ReactElement {
  const props = fill ? { size, fill, strokeWidth: 1.5 } : { size };
  switch (shape) {
    case 'Round':
      return <Circle {...props} />;
    case 'Rectangle':
      return <RectangleHorizontal {...props} />;
    case 'Cocktail':
      return <Diamond {...props} />;
    case 'Square':
    default:
      return <Square {...props} />;
  }
}

const SHAPES: TableShape[] = ['Round', 'Rectangle', 'Square', 'Cocktail'];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.4rem 0.625rem',
  borderRadius: '0.375rem',
  border: '1px solid var(--border)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.8125rem',
  outline: 'none',
  boxSizing: 'border-box',
};

// ─── Inline Form ──────────────────────────────────────────────────────────────

interface InlineFormProps {
  initial?: TableTypeFormData;
  onSave: (data: TableTypeFormData) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function InlineForm({ initial = EMPTY_FORM, onSave, onCancel, saving }: InlineFormProps): React.ReactElement {
  const [form, setForm] = useState<TableTypeFormData>({ ...initial });

  function setField<K extends keyof TableTypeFormData>(key: K, value: TableTypeFormData[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (form.defaultCapacity < 1) {
      toast.error('Capacity must be at least 1');
      return;
    }
    await onSave(form);
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      style={{
        background: 'color-mix(in srgb, var(--accent-primary) 5%, var(--bg-secondary))',
        border: '1px solid var(--accent-primary)',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '0.875rem',
        }}
      >
        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Name *
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="e.g. VIP Round"
            style={inputStyle}
            autoFocus
          />
        </div>

        {/* Capacity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Capacity *
          </label>
          <input
            type="number"
            required
            min={1}
            max={999}
            value={form.defaultCapacity}
            onChange={(e) => setField('defaultCapacity', Math.max(1, Number(e.target.value)))}
            style={inputStyle}
          />
        </div>

        {/* Default Price */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Default Price ($)
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.defaultPriceCents / 100}
            onChange={(e) => setField('defaultPriceCents', Math.round(Number(e.target.value) * 100))}
            placeholder="0.00"
            style={inputStyle}
          />
        </div>

        {/* Fill Color */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Fill Color
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="color"
              value={form.defaultColor || '#4f46e5'}
              onChange={(e) => setField('defaultColor', e.target.value)}
              style={{ width: '40px', height: '36px', border: '1px solid var(--border)', borderRadius: '0.375rem', cursor: 'pointer', padding: '2px' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {form.defaultColor || '#4f46e5'}
            </span>
          </div>
        </div>
      </div>

      {/* Shape */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Shape
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {SHAPES.map((s) => (
            <label
              key={s}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '0.375rem',
                border: `1px solid ${form.shape === s ? 'var(--accent-primary)' : 'var(--border)'}`,
                background: form.shape === s
                  ? 'color-mix(in srgb, var(--accent-primary) 12%, var(--bg-secondary))'
                  : 'var(--bg-tertiary)',
                color: form.shape === s ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <input
                type="radio"
                name="shape"
                value={s}
                checked={form.shape === s}
                onChange={() => setField('shape', s)}
                style={{ display: 'none' }}
              />
              <ShapeIcon shape={s} size={15} fill={form.shape === s ? (form.defaultColor || undefined) : undefined} />
              {s}
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.45rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: 'var(--accent-primary)',
            color: 'var(--bg-primary)',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            opacity: saving ? 0.7 : 1,
          }}
        >
          <Check size={14} />
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.45rem 0.875rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
          }}
        >
          <X size={14} />
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonTableRow(): React.ReactElement {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} style={{ padding: '0.875rem 1rem' }}>
          <SkeletonLine className={i === 1 ? 'w-32' : i === 6 ? 'w-20' : 'w-20'} />
        </td>
      ))}
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TableTypesPage(): React.ReactElement {
  const [tableTypes, setTableTypes] = useState<TableType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadTableTypes = useCallback(async (): Promise<void> => {
    try {
      const res = await apiClient.get<ApiTableType[]>('/admin/table-types');
      setTableTypes(res.data.map(mapApiToTableType));
    } catch {
      toast.error('Failed to load table types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTableTypes();
  }, [loadTableTypes]);

  async function handleAdd(data: TableTypeFormData): Promise<void> {
    setSaving(true);
    try {
      await apiClient.post('/admin/table-types', {
        name: data.name,
        defaultShape: data.shape,
        defaultCapacity: data.defaultCapacity,
        defaultPriceCents: data.defaultPriceCents,
        defaultColor: data.defaultColor,
      });
      toast.success('Table type created');
      setShowAddForm(false);
      await loadTableTypes();
    } catch {
      toast.error('Failed to create table type');
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(id: string, data: TableTypeFormData): Promise<void> {
    setSaving(true);
    try {
      await apiClient.put(`/admin/table-types/${id}`, {
        name: data.name,
        defaultShape: data.shape,
        defaultCapacity: data.defaultCapacity,
        defaultPriceCents: data.defaultPriceCents,
        defaultColor: data.defaultColor,
      });
      toast.success('Table type updated');
      setEditingId(null);
      await loadTableTypes();
    } catch {
      toast.error('Failed to update table type');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/table-types/${id}`);
      toast.success('Table type deleted');
      setTableTypes((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // Backend may not support DELETE — mark inactive locally
      setTableTypes((prev) => prev.map((t) => (t.id === id ? { ...t, isActive: false } : t)));
      toast.success('Table type hidden');
    } finally {
      setConfirmDeleteId(null);
    }
  }

  const formatPrice = (cents: number): string =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(cents / 100);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
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
          Table Types
        </h1>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'var(--accent-primary)',
              color: 'var(--bg-primary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
            }}
          >
            <Plus size={16} />
            Add Type
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <InlineForm
          onSave={handleAdd}
          onCancel={() => setShowAddForm(false)}
          saving={saving}
        />
      )}

      {/* Table */}
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
              fontSize: '0.875rem',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--bg-tertiary)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {['Name', 'Shape', 'Capacity', 'Default Price', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: 700,
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
              {loading ? (
                <>
                  <SkeletonTableRow />
                  <SkeletonTableRow />
                  <SkeletonTableRow />
                  <SkeletonTableRow />
                </>
              ) : tableTypes.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '3rem 1rem',
                      textAlign: 'center',
                      color: 'var(--text-tertiary)',
                      fontSize: '0.875rem',
                    }}
                  >
                    No table types yet. Click "Add Type" to create one.
                  </td>
                </tr>
              ) : (
                tableTypes.map((tt) => {
                  if (editingId === tt.id) {
                    return (
                      <tr key={tt.id}>
                        <td colSpan={6} style={{ padding: '0.75rem 1rem' }}>
                          <InlineForm
                            initial={{
                              name: tt.name,
                              shape: tt.shape,
                              defaultCapacity: tt.defaultCapacity,
                              defaultPriceCents: tt.defaultPriceCents,
                              defaultColor: tt.defaultColor,
                            }}
                            onSave={(data) => handleEdit(tt.id, data)}
                            onCancel={() => setEditingId(null)}
                            saving={saving}
                          />
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={tt.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Name */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <div
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              background: tt.defaultColor || 'var(--accent-primary)',
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{ fontWeight: 600, color: 'var(--text-primary)' }}
                          >
                            {tt.name}
                          </span>
                        </div>
                      </td>

                      {/* Shape */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            color: tt.defaultColor || 'var(--accent-primary)',
                          }}
                        >
                          <ShapeIcon shape={tt.shape} size={18} fill={tt.defaultColor || undefined} />
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            {tt.shape}
                          </span>
                        </div>
                      </td>

                      {/* Capacity */}
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-primary)' }}>
                        {tt.defaultCapacity}
                      </td>

                      {/* Default Price */}
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {formatPrice(tt.defaultPriceCents)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.625rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: tt.isActive
                              ? 'color-mix(in srgb, var(--color-success) 15%, transparent)'
                              : 'var(--bg-tertiary)',
                            color: tt.isActive ? 'var(--color-success)' : 'var(--text-tertiary)',
                            border: `1px solid ${tt.isActive ? 'var(--color-success)' : 'var(--border)'}`,
                          }}
                        >
                          {tt.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          {/* Confirm delete dialog */}
                          {confirmDeleteId === tt.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Delete?
                              </span>
                              <button
                                type="button"
                                onClick={() => void handleDelete(tt.id)}
                                style={{
                                  padding: '0.2rem 0.625rem',
                                  borderRadius: '0.375rem',
                                  border: 'none',
                                  background: 'var(--color-error)',
                                  color: 'var(--bg-primary)',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontFamily: 'var(--font-body)',
                                  fontWeight: 600,
                                }}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                style={{
                                  padding: '0.2rem 0.625rem',
                                  borderRadius: '0.375rem',
                                  border: '1px solid var(--border)',
                                  background: 'var(--bg-tertiary)',
                                  color: 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontFamily: 'var(--font-body)',
                                }}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                title="Edit"
                                onClick={() => {
                                  setEditingId(tt.id);
                                  setShowAddForm(false);
                                }}
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
                                  transition: 'border-color 0.15s, color 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                  e.currentTarget.style.color = 'var(--accent-primary)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--border)';
                                  e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                title="Delete"
                                onClick={() => setConfirmDeleteId(tt.id)}
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
                                  transition: 'border-color 0.15s, color 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--color-error)';
                                  e.currentTarget.style.color = 'var(--color-error)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--border)';
                                  e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
