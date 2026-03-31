import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Circle, RectangleHorizontal, Square, Diamond, X, Check, ChevronDown, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/adminApi';
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
        className="c829-form-grid"
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

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard(): React.ReactElement {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <div style={{ width: '36px', height: '36px', borderRadius: '0.5rem', background: 'var(--bg-tertiary)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ height: '14px', width: '40%', borderRadius: '4px', background: 'var(--bg-tertiary)' }} />
        <div style={{ height: '11px', width: '25%', borderRadius: '4px', background: 'var(--bg-tertiary)' }} />
      </div>
      <div style={{ height: '20px', width: '56px', borderRadius: '999px', background: 'var(--bg-tertiary)', flexShrink: 0 }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TableTypesPage(): React.ReactElement {
  const [tableTypes, setTableTypes] = useState<TableType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadTableTypes = useCallback(async (): Promise<void> => {
    try {
      const res = await adminApi.tableTypes.list<ApiTableType[]>();
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
      await adminApi.tableTypes.create({
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
      await adminApi.tableTypes.update(id, {
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

  async function handleToggleActive(id: string, active: boolean): Promise<void> {
    try {
      const tt = tableTypes.find((t) => t.id === id);
      if (!tt) return;
      await adminApi.tableTypes.update(id, {
        name: tt.name,
        defaultCapacity: tt.defaultCapacity,
        defaultShape: tt.shape,
        defaultColor: tt.defaultColor,
        defaultPriceCents: tt.defaultPriceCents,
      });
      // Also toggle via delete endpoint if disabling
      if (!active) {
        await adminApi.tableTypes.delete(id).catch(() => {});
      }
      setTableTypes((prev) => prev.map((t) => (t.id === id ? { ...t, isActive: active } : t)));
      toast.success(active ? 'Table type enabled' : 'Table type disabled');
    } catch {
      toast.error('Failed to update');
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
        className="c829-page-header"
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

      {/* Card list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : tableTypes.length === 0 ? (
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
            No table types yet. Click "Add Type" to create one.
          </div>
        ) : (
          tableTypes.map((tt) => {
            const isExpanded = expandedId === tt.id;
            const accentColor = tt.defaultColor || 'var(--accent-primary)';

            if (editingId === tt.id) {
              return (
                <InlineForm
                  key={tt.id}
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
              );
            }

            return (
              <div
                key={tt.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${isExpanded ? accentColor : 'var(--border)'}`,
                  borderLeft: `4px solid ${accentColor}`,
                  borderRadius: '0.75rem',
                  boxShadow: isExpanded ? `0 0 0 1px ${accentColor}22` : 'var(--shadow-card)',
                  opacity: tt.isActive ? 1 : 0.55,
                  transition: 'border-color 0.2s, box-shadow 0.2s, opacity 0.2s',
                  overflow: 'hidden',
                }}
              >
                {/* Card header — always visible, click to expand */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : tt.id)}
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
                  {/* Shape icon badge */}
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '0.5rem',
                      background: `${accentColor}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: accentColor,
                    }}
                  >
                    <ShapeIcon shape={tt.shape} size={20} fill={tt.defaultColor || undefined} />
                  </div>

                  {/* Name + shape hint */}
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
                      {tt.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                      {tt.shape} · {tt.defaultCapacity} seats
                    </div>
                  </div>

                  {/* Price */}
                  <span
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      flexShrink: 0,
                      fontFamily: 'var(--font-mono, var(--font-body))',
                    }}
                  >
                    {formatPrice(tt.defaultPriceCents)}
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

                {/* Expanded detail row */}
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
                    {/* Shape pill */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '999px',
                        background: `${accentColor}18`,
                        border: `1px solid ${accentColor}44`,
                        color: accentColor,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      <ShapeIcon shape={tt.shape} size={13} fill={tt.defaultColor || undefined} />
                      {tt.shape}
                    </div>

                    {/* Capacity badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '999px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      <Users size={13} />
                      {tt.defaultCapacity} seats
                    </div>

                    {/* Status toggle */}
                    <button
                      type="button"
                      title={tt.isActive ? 'Click to disable' : 'Click to enable'}
                      onClick={() => void handleToggleActive(tt.id, !tt.isActive)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: tt.isActive
                          ? 'color-mix(in srgb, var(--color-success) 15%, transparent)'
                          : 'var(--bg-secondary)',
                        color: tt.isActive ? 'var(--color-success)' : 'var(--text-tertiary)',
                        border: `1px solid ${tt.isActive ? 'var(--color-success)' : 'var(--border)'}`,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                      }}
                    >
                      <div style={{
                        width: '26px', height: '15px', borderRadius: '8px',
                        background: tt.isActive ? 'var(--color-success)' : 'var(--border)',
                        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                      }}>
                        <div style={{
                          width: '11px', height: '11px', borderRadius: '50%',
                          background: 'var(--bg-primary)',
                          position: 'absolute', top: '2px',
                          left: tt.isActive ? '13px' : '2px',
                          transition: 'left 0.2s',
                        }} />
                      </div>
                      {tt.isActive ? 'Active' : 'Disabled'}
                    </button>

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Edit button */}
                    <button
                      type="button"
                      disabled={!tt.isActive}
                      title={tt.isActive ? 'Edit' : 'Enable first to edit'}
                      onClick={tt.isActive ? () => {
                        setEditingId(tt.id);
                        setExpandedId(null);
                        setShowAddForm(false);
                      } : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.4rem 0.875rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border)',
                        background: tt.isActive ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                        color: tt.isActive ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                        cursor: tt.isActive ? 'pointer' : 'not-allowed',
                        opacity: tt.isActive ? 1 : 0.45,
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        fontFamily: 'var(--font-body)',
                        transition: 'border-color 0.15s, color 0.15s',
                      }}
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
