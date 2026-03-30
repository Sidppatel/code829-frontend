import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  GripVertical,
  Pencil,
  Trash2,
  Plus,
  Tag,
  Calendar,
  Hash,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Info,
  ExternalLink,
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';

// ─── Types ────────────────────────────────────────────────────────────────────

type RuleType = 'Standard' | 'EarlyBird' | 'FirstN';

interface PricingRule {
  id: string;
  eventId: string;
  tableTypeId: string | null;
  tableTypeName: string | null;
  name: string;
  type: RuleType;
  priceCents: number;
  validFrom: string | null;
  validUntil: string | null;
  maxCount: number | null;
  usedCount: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface TableType {
  id: string;
  name: string;
}

interface ResolvedPrice {
  priceCents: number;
  ruleName: string;
  ruleType: RuleType;
  ruleId: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PricingStepProps {
  eventId: string | null;
  layoutMode: 'Grid' | 'CapacityOnly' | 'None';
  maxCapacity?: number;
}

// ─── Zod schema for rule form ─────────────────────────────────────────────────

const ruleFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['Standard', 'EarlyBird', 'FirstN'] as const),
    priceDisplay: z
      .string()
      .min(1, 'Price is required')
      .refine((v) => {
        const n = parseFloat(v);
        return !isNaN(n) && n > 0;
      }, 'Price must be greater than $0.00'),
    validFrom: z.string().optional(),
    validUntil: z.string().optional(),
    maxCount: z.string().optional(),
    tableTypeId: z.string().optional(),
    sortOrder: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'EarlyBird') {
      if (!data.validFrom) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Valid From is required for Early Bird', path: ['validFrom'] });
      }
      if (!data.validUntil) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Valid Until is required for Early Bird', path: ['validUntil'] });
      }
    }
    if (data.type === 'FirstN') {
      if (!data.maxCount || isNaN(Number(data.maxCount)) || Number(data.maxCount) < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Must be at least 1', path: ['maxCount'] });
      }
    }
  });

type RuleFormValues = z.infer<typeof ruleFormSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

function dollarsToCents(dollars: string): number {
  return Math.round(parseFloat(dollars) * 100);
}

function formatPrice(cents: number): string {
  return `$${centsToDollars(cents)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: RuleType }): React.ReactElement {
  const styles: Record<RuleType, React.CSSProperties> = {
    Standard: {
      background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
      color: 'var(--accent-primary)',
      border: '1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)',
    },
    EarlyBird: {
      background: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
      color: 'var(--color-success)',
      border: '1px solid color-mix(in srgb, var(--color-success) 30%, transparent)',
    },
    FirstN: {
      background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
      color: 'var(--color-warning)',
      border: '1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)',
    },
  };
  const labels: Record<RuleType, string> = {
    Standard: 'Standard',
    EarlyBird: 'Early Bird',
    FirstN: 'First N',
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.175rem 0.5rem',
        borderRadius: '999px',
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.03em',
        ...styles[type],
      }}
    >
      {labels[type]}
    </span>
  );
}

interface DeleteConfirmProps {
  ruleName: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}

function DeleteConfirm({ ruleName, onConfirm, onCancel, deleting }: DeleteConfirmProps): React.ReactElement {
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
        zIndex: 400,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '0.875rem',
          padding: '1.5rem',
          maxWidth: '380px',
          width: '100%',
          boxShadow: 'var(--shadow-card-hover)',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 0.625rem',
          }}
        >
          Delete Pricing Rule
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
          Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{ruleName}</strong>?
          This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            style={{
              padding: '0.5rem 1.125rem',
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
            type="button"
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
              opacity: deleting ? 0.7 : 1,
            }}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Rule form ────────────────────────────────────────────────────────────────

interface RuleFormProps {
  tableTypes: TableType[];
  defaultValues?: Partial<RuleFormValues>;
  onSave: (values: RuleFormValues) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function RuleForm({ tableTypes, defaultValues, onSave, onCancel, saving }: RuleFormProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      name: '',
      type: 'Standard',
      priceDisplay: '',
      validFrom: '',
      validUntil: '',
      maxCount: '',
      tableTypeId: '',
      sortOrder: '',
      ...defaultValues,
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedType = watch('type');

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '0.625rem 0.875rem',
    borderRadius: '0.5rem',
    border: `1px solid ${hasError ? 'var(--color-error)' : 'var(--border)'}`,
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  });

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '0.3rem',
  };

  const fieldError = (msg: string | undefined): React.ReactElement | null =>
    msg ? <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--color-error)' }}>{msg}</p> : null;

  const TYPE_CARDS: { value: RuleType; icon: React.ReactElement; title: string; desc: string }[] = [
    {
      value: 'Standard',
      icon: <Tag size={18} />,
      title: 'Standard',
      desc: 'Default price for all tickets',
    },
    {
      value: 'EarlyBird',
      icon: <Calendar size={18} />,
      title: 'Early Bird',
      desc: 'Discounted price before a deadline',
    },
    {
      value: 'FirstN',
      icon: <Hash size={18} />,
      title: 'First N',
      desc: 'Special price for first N bookings',
    },
  ];

  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--accent-primary)',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        marginTop: '0.75rem',
      }}
    >
      <h4
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.9375rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 1rem',
        }}
      >
        {defaultValues ? 'Edit Rule' : 'New Pricing Rule'}
      </h4>

      <form onSubmit={(e) => void handleSubmit(onSave)(e)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Name */}
          <div>
            <label style={labelStyle}>Rule Name *</label>
            <input
              type="text"
              placeholder="e.g. General Admission"
              {...register('name')}
              style={inputStyle(Boolean(errors.name))}
            />
            {fieldError(errors.name?.message)}
          </div>

          {/* Type radio cards */}
          <div>
            <label style={labelStyle}>Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
              {TYPE_CARDS.map((card) => {
                const isSelected = watchedType === card.value;
                return (
                  <label
                    key={card.value}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.375rem',
                      padding: '0.75rem',
                      borderRadius: '0.625rem',
                      border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border)'}`,
                      background: isSelected
                        ? 'color-mix(in srgb, var(--accent-primary) 8%, var(--bg-secondary))'
                        : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <input
                      type="radio"
                      value={card.value}
                      {...register('type')}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    />
                    <span style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                      {card.icon}
                    </span>
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                      }}
                    >
                      {card.title}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                      {card.desc}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Price */}
          <div>
            <label style={labelStyle}>Price *</label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  pointerEvents: 'none',
                }}
              >
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...register('priceDisplay')}
                style={{ ...inputStyle(Boolean(errors.priceDisplay)), paddingLeft: '1.625rem' }}
              />
            </div>
            {fieldError(errors.priceDisplay?.message)}
          </div>

          {/* Early Bird date range */}
          {watchedType === 'EarlyBird' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Valid From *</label>
                <input
                  type="date"
                  {...register('validFrom')}
                  style={inputStyle(Boolean(errors.validFrom))}
                />
                {fieldError(errors.validFrom?.message)}
              </div>
              <div>
                <label style={labelStyle}>Valid Until *</label>
                <input
                  type="date"
                  {...register('validUntil')}
                  style={inputStyle(Boolean(errors.validUntil))}
                />
                {fieldError(errors.validUntil?.message)}
              </div>
            </div>
          )}

          {/* First N max count */}
          {watchedType === 'FirstN' && (
            <div>
              <label style={labelStyle}>First N Bookings at This Price *</label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 50"
                {...register('maxCount')}
                style={inputStyle(Boolean(errors.maxCount))}
              />
              {fieldError(errors.maxCount?.message)}
            </div>
          )}

          {/* Table Type filter */}
          <div>
            <label style={labelStyle}>Table Type Filter (optional)</label>
            <select
              {...register('tableTypeId')}
              style={{
                ...inputStyle(false),
                cursor: 'pointer',
              }}
            >
              <option value="">All ticket types</option>
              {tableTypes.map((tt) => (
                <option key={tt.id} value={tt.id}>
                  {tt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              style={{
                padding: '0.55rem 1.125rem',
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
              type="submit"
              disabled={saving}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'var(--accent-primary)',
                color: 'var(--bg-primary)',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: 600,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Save Rule'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PricingStep({ eventId, layoutMode, maxCapacity }: PricingStepProps): React.ReactElement {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [tableTypes, setTableTypes] = useState<TableType[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedPrice, setResolvedPrice] = useState<ResolvedPrice | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);

  // UI state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PricingRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);



  // Drag state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadRules = useCallback(async (): Promise<void> => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    try {
      const res = await adminApi.pricing.list<PricingRule[]>(eventId);
      setRules(res.data.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch {
      toast.error('Failed to load pricing rules');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  useEffect(() => {
    let cancelled = false;
    async function loadTableTypes(): Promise<void> {
      try {
        const res = await adminApi.tableTypes.list<TableType[]>();
        if (!cancelled) setTableTypes(res.data);
      } catch {
        // non-critical — table types optional
      }
    }
    void loadTableTypes();
    return () => { cancelled = true; };
  }, []);

  // Resolve price (re-fetch whenever rules change)
  useEffect(() => {
    if (!eventId || rules.length === 0) {
      setResolvedPrice(null);
      return;
    }
    let cancelled = false;
    async function resolvePrice(): Promise<void> {
      setResolveLoading(true);
      try {
        const res = await adminApi.pricing.resolve<ResolvedPrice>(eventId!);
        if (!cancelled) setResolvedPrice(res.data);
      } catch {
        if (!cancelled) setResolvedPrice(null);
      } finally {
        if (!cancelled) setResolveLoading(false);
      }
    }
    void resolvePrice();
    return () => { cancelled = true; };
  }, [eventId, rules]);

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  async function handleAddRule(values: RuleFormValues): Promise<void> {
    if (!eventId) return;
    setSaving(true);
    try {
      const payload: Record<string, string | number | null | undefined> = {
        name: values.name,
        type: values.type,
        priceCents: dollarsToCents(values.priceDisplay),
        tableTypeId: values.tableTypeId || null,
        sortOrder: values.sortOrder ? Number(values.sortOrder) : rules.length,
      };
      if (values.type === 'EarlyBird') {
        payload.validFrom = values.validFrom ?? null;
        payload.validUntil = values.validUntil ?? null;
      }
      if (values.type === 'FirstN') {
        payload.maxCount = values.maxCount ? Number(values.maxCount) : null;
      }
      await adminApi.pricing.create(eventId, payload);
      toast.success('Pricing rule added');
      setShowAddForm(false);
      await loadRules();
    } catch {
      toast.error('Failed to add pricing rule');
    } finally {
      setSaving(false);
    }
  }

  async function handleEditRule(ruleId: string, values: RuleFormValues): Promise<void> {
    if (!eventId) return;
    setSaving(true);
    try {
      const payload: Record<string, string | number | null | undefined> = {
        name: values.name,
        type: values.type,
        priceCents: dollarsToCents(values.priceDisplay),
        tableTypeId: values.tableTypeId || null,
      };
      if (values.type === 'EarlyBird') {
        payload.validFrom = values.validFrom ?? null;
        payload.validUntil = values.validUntil ?? null;
      } else {
        payload.validFrom = null;
        payload.validUntil = null;
      }
      if (values.type === 'FirstN') {
        payload.maxCount = values.maxCount ? Number(values.maxCount) : null;
      } else {
        payload.maxCount = null;
      }
      await adminApi.pricing.update(eventId, ruleId, payload);
      toast.success('Rule updated');
      setEditingRuleId(null);
      await loadRules();
    } catch {
      toast.error('Failed to update rule');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(rule: PricingRule): Promise<void> {
    if (!eventId) return;
    try {
      await adminApi.pricing.update(eventId, rule.id, {
        isActive: !rule.isActive,
      });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r))
      );
    } catch {
      toast.error('Failed to update rule');
    }
  }

  async function handleDelete(): Promise<void> {
    if (!eventId || !deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.pricing.delete(eventId, deleteTarget.id);
      toast.success('Rule deleted');
      setDeleteTarget(null);
      await loadRules();
    } catch {
      toast.error('Failed to delete rule');
    } finally {
      setDeleting(false);
    }
  }

  // ── Drag-and-drop reorder ─────────────────────────────────────────────────

  function handleDragStart(index: number): void {
    dragIndexRef.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number): void {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDragLeave(): void {
    setDragOverIndex(null);
  }

  async function handleDrop(dropIndex: number): Promise<void> {
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === dropIndex) {
      setDragOverIndex(null);
      dragIndexRef.current = null;
      return;
    }

    const reordered = [...rules];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    const withNewOrder = reordered.map((r, i) => ({ ...r, sortOrder: i }));
    setRules(withNewOrder);
    setDragOverIndex(null);
    dragIndexRef.current = null;

    if (!eventId) return;
    try {
      await adminApi.pricing.reorder(eventId, {
        rules: withNewOrder.map((r) => ({ id: r.id, sortOrder: r.sortOrder })),
      });
    } catch {
      toast.error('Failed to save order');
      await loadRules();
    }
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const hasStandardRule = rules.some((r) => r.type === 'Standard' && r.isActive);
  const hasActiveRule = rules.some((r) => r.isActive);



  // ── Render ────────────────────────────────────────────────────────────────

  const sectionCard: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '0.875rem',
    padding: '1.25rem',
    marginBottom: '1.25rem',
  };

  const sectionHeader: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  };

  const sectionTitle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  };

  const warningBox: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.625rem',
    background: 'color-mix(in srgb, var(--color-warning) 12%, transparent)',
    border: '1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)',
    borderRadius: '0.625rem',
    padding: '0.75rem 1rem',
    fontSize: '0.8125rem',
    color: 'var(--color-warning)',
    marginTop: '0.75rem',
  };

  const infoBox: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.625rem',
    background: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
    border: '1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)',
    borderRadius: '0.625rem',
    padding: '0.75rem 1rem',
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    marginTop: '0.75rem',
  };

  if (!eventId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={sectionCard}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem 0' }}>
            Save event to configure pricing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Section 1: Pricing Rules ──────────────────────────────────────── */}
      <div style={sectionCard}>
        <div style={sectionHeader}>
          <h3 style={sectionTitle}>Pricing Rules</h3>
          {!showAddForm && editingRuleId === null && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.45rem 0.875rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'var(--accent-primary)',
                color: 'var(--bg-primary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              <Plus size={14} />
              Add Rule
            </button>
          )}
        </div>

        {/* Rules list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: '60px',
                  borderRadius: '0.625rem',
                  background: 'var(--bg-tertiary)',
                  animation: 'pricing-pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : rules.length === 0 && !showAddForm ? (
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '1.5rem 0' }}>
            No pricing rules yet. Add one to get started.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {rules.map((rule, index) => {
              const isEditing = editingRuleId === rule.id;
              const isDragOver = dragOverIndex === index;

              if (isEditing) {
                const editDefaults: Partial<RuleFormValues> = {
                  name: rule.name,
                  type: rule.type,
                  priceDisplay: centsToDollars(rule.priceCents),
                  validFrom: rule.validFrom ? rule.validFrom.slice(0, 10) : '',
                  validUntil: rule.validUntil ? rule.validUntil.slice(0, 10) : '',
                  maxCount: rule.maxCount != null ? String(rule.maxCount) : '',
                  tableTypeId: rule.tableTypeId ?? '',
                };
                return (
                  <RuleForm
                    key={rule.id}
                    tableTypes={tableTypes}
                    defaultValues={editDefaults}
                    onSave={(values) => handleEditRule(rule.id, values)}
                    onCancel={() => setEditingRuleId(null)}
                    saving={saving}
                  />
                );
              }

              return (
                <div
                  key={rule.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => void handleDrop(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.75rem 0.875rem',
                    borderRadius: '0.625rem',
                    border: `1px solid ${isDragOver ? 'var(--accent-primary)' : 'var(--border)'}`,
                    background: isDragOver
                      ? 'color-mix(in srgb, var(--accent-primary) 6%, var(--bg-primary))'
                      : rule.isActive
                      ? 'var(--bg-primary)'
                      : 'color-mix(in srgb, var(--text-tertiary) 5%, var(--bg-primary))',
                    transition: 'border-color 0.15s, background 0.15s',
                    opacity: rule.isActive ? 1 : 0.65,
                    cursor: 'grab',
                  }}
                >
                  {/* Drag handle */}
                  <span
                    style={{
                      color: 'var(--text-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                      cursor: 'grab',
                    }}
                  >
                    <GripVertical size={16} />
                  </span>

                  {/* Rule info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {rule.name}
                      </span>
                      <TypeBadge type={rule.type} />
                      {rule.tableTypeName && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-tertiary)',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '0.1rem 0.375rem',
                          }}
                        >
                          {rule.tableTypeName}
                        </span>
                      )}
                    </div>
                    {rule.type === 'EarlyBird' && rule.validFrom && rule.validUntil && (
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                        {rule.validFrom.slice(0, 10)} → {rule.validUntil.slice(0, 10)}
                      </p>
                    )}
                    {rule.type === 'FirstN' && rule.maxCount != null && (
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                        First {rule.maxCount} bookings ({rule.usedCount} used)
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <span
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      flexShrink: 0,
                    }}
                  >
                    {formatPrice(rule.priceCents)}
                  </span>

                  {/* Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                    {/* Active toggle */}
                    <button
                      type="button"
                      onClick={() => void handleToggleActive(rule)}
                      title={rule.isActive ? 'Deactivate rule' : 'Activate rule'}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.3rem',
                        color: rule.isActive ? 'var(--color-success)' : 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '0.375rem',
                        transition: 'color 0.15s',
                      }}
                    >
                      {rule.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingRuleId(rule.id);
                      }}
                      title="Edit rule"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.3rem',
                        color: 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '0.375rem',
                        transition: 'color 0.15s',
                      }}
                    >
                      <Pencil size={15} />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(rule)}
                      title="Delete rule"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.3rem',
                        color: 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '0.375rem',
                        transition: 'color 0.15s',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add rule inline form */}
        {showAddForm && (
          <RuleForm
            tableTypes={tableTypes}
            onSave={handleAddRule}
            onCancel={() => setShowAddForm(false)}
            saving={saving}
          />
        )}
      </div>

      {/* ── Section 2: Pricing Preview ────────────────────────────────────── */}
      <div style={sectionCard}>
        <h3 style={{ ...sectionTitle, marginBottom: '0.875rem' }}>Current Effective Price</h3>

        {resolveLoading ? (
          <div
            style={{
              height: '48px',
              borderRadius: '0.5rem',
              background: 'var(--bg-tertiary)',
              animation: 'pricing-pulse 1.5s ease-in-out infinite',
            }}
          />
        ) : resolvedPrice ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              background: 'color-mix(in srgb, var(--color-success) 8%, var(--bg-primary))',
              border: '1px solid color-mix(in srgb, var(--color-success) 25%, transparent)',
              borderRadius: '0.625rem',
            }}
          >
            <span
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {formatPrice(resolvedPrice.priceCents)}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>per ticket</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{resolvedPrice.ruleName}</span>
              <TypeBadge type={resolvedPrice.ruleType} />
            </div>
          </div>
        ) : hasActiveRule ? (
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
            Calculating price…
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            No pricing rules configured
          </p>
        )}
      </div>

      {/* ── Section 3: Layout-specific ────────────────────────────────────── */}
      {layoutMode === 'Grid' && (
        <div style={sectionCard}>
          <h3 style={{ ...sectionTitle, marginBottom: '0.625rem' }}>Table Pricing</h3>
          <div style={infoBox}>
            <Info size={16} style={{ flexShrink: 0, marginTop: '0.1rem', color: 'var(--accent-primary)' }} />
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              Default pricing is set per table in the Layout Editor. Rules above apply on top of table base prices.
            </p>
          </div>
          <div style={{ marginTop: '0.875rem' }}>
            <a
              href={`/admin/events/${eventId}/layout`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.8125rem',
                color: 'var(--accent-primary)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Edit in Layout Editor
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      )}

      {layoutMode === 'CapacityOnly' && (
        <div style={sectionCard}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.75rem 1rem',
              background: 'color-mix(in srgb, var(--accent-primary) 6%, var(--bg-primary))',
              border: '1px solid color-mix(in srgb, var(--accent-primary) 18%, transparent)',
              borderRadius: '0.625rem',
            }}
          >
            <Info size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Event capacity:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {maxCapacity != null ? `${maxCapacity} guests` : '—'}
              </strong>
            </span>
          </div>
          {!hasStandardRule && (
            <div style={warningBox}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <span>Add at least one Standard pricing rule for General Admission events.</span>
            </div>
          )}
        </div>
      )}

      {layoutMode === 'None' && !hasStandardRule && (
        <div style={sectionCard}>
          <div style={warningBox}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <span>Add at least one Standard pricing rule so attendees can purchase tickets.</span>
          </div>
        </div>
      )}



      {/* Delete confirm dialog */}
      {deleteTarget && (
        <DeleteConfirm
          ruleName={deleteTarget.name}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      <style>{`@keyframes pricing-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
