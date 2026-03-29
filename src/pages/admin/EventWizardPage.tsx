import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Check,
  Grid3X3,
  Users,
  Ticket,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import { useEventWizardStore } from '../../stores/eventWizardStore';
import type { LayoutMode } from '../../stores/eventWizardStore';

const GridEditor = lazy(() => import('./editors/GridEditor'));
const PricingStep = lazy(() => import('./editors/PricingStep'));
const ReviewStep = lazy(() => import('./editors/ReviewStep'));

// ─── Types ───────────────────────────────────────────────────────────────────

interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface VenueListResponse {
  items: Venue[];
  totalCount: number;
}

interface EventApiObject {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  venueId: string;
  bannerImageUrl: string | null;
  layoutMode: LayoutMode;
  maxCapacity: number | null;
  platformFeePercent: number;
  isFeatured: boolean;
  status: string;
}

// ─── Zod schema ──────────────────────────────────────────────────────────────

const wizardSchema = z
  .object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Max 500 characters'),
    category: z.string().min(1, 'Category is required'),
    startDate: z.string().min(1, 'Start date is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endDate: z.string().min(1, 'End date is required'),
    endTime: z.string().min(1, 'End time is required'),
    venueId: z.string().min(1, 'Venue is required'),
    bannerImageUrl: z.string().optional().or(z.literal('')),
    layoutMode: z.enum(['Grid', 'CapacityOnly', 'None'], { required_error: 'Layout mode is required' }),
    maxCapacity: z.string().optional(),
    platformFeePercent: z.string().optional(),
    isFeatured: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.startTime && data.endTime) {
      const start = new Date(`${data.startDate}T${data.startTime}`);
      const end = new Date(`${data.endDate}T${data.endTime}`);
      if (end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End date/time must be after start date/time',
          path: ['endDate'],
        });
      }
    }
    if (data.layoutMode === 'CapacityOnly') {
      if (!data.maxCapacity || isNaN(Number(data.maxCapacity)) || Number(data.maxCapacity) < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Max capacity is required for General Admission',
          path: ['maxCapacity'],
        });
      }
    }
  });

type WizardFormValues = z.infer<typeof wizardSchema>;

// ─── Venue modal schema ───────────────────────────────────────────────────────

const newVenueSchema = z.object({
  name: z.string().min(2, 'Min 2 characters'),
  address: z.string().min(2, 'Min 2 characters'),
  city: z.string().min(2, 'Min 2 characters'),
  state: z.string().length(2, 'Must be 2 characters (e.g. CA)'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Must be a valid ZIP code'),
  capacity: z.string().optional(),
});

type NewVenueFormValues = z.infer<typeof newVenueSchema>;

const CATEGORIES = ['Music', 'Business', 'Social', 'Dining', 'Tech', 'Arts', 'Family', 'Sports'];

const STEP_LABELS = ['Basics', 'Layout', 'Pricing', 'Review'];

// ─── FloatingInput ────────────────────────────────────────────────────────────

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  fieldId: string;
}

function FloatingInput({ label, error, fieldId, ...props }: FloatingInputProps): React.ReactElement {
  const [focused, setFocused] = useState(false);
  const hasValue = Boolean(props.value !== undefined ? String(props.value) : '');

  return (
    <div style={{ position: 'relative', marginTop: '0.25rem' }}>
      <input
        id={fieldId}
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        placeholder=" "
        style={{
          width: '100%',
          padding: '1.375rem 0.875rem 0.5rem',
          borderRadius: '0.5rem',
          border: `1px solid ${error ? 'var(--color-error)' : focused ? 'var(--accent-primary)' : 'var(--border)'}`,
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.9rem',
          outline: 'none',
          boxShadow: focused
            ? '0 0 0 3px color-mix(in srgb, var(--accent-primary) 18%, transparent)'
            : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxSizing: 'border-box',
          ...props.style,
        }}
      />
      <label
        htmlFor={fieldId}
        style={{
          position: 'absolute',
          left: '0.875rem',
          top: focused || hasValue ? '0.35rem' : '0.9rem',
          fontSize: focused || hasValue ? '0.7rem' : '0.875rem',
          fontWeight: focused || hasValue ? 600 : 400,
          color: error
            ? 'var(--color-error)'
            : focused
            ? 'var(--accent-primary)'
            : 'var(--text-tertiary)',
          transition: 'top 0.15s ease, font-size 0.15s ease, color 0.15s ease',
          pointerEvents: 'none',
          letterSpacing: focused || hasValue ? '0.04em' : 'normal',
          textTransform: focused || hasValue ? 'uppercase' : 'none',
        }}
      >
        {label}
      </label>
      {error && (
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-error)' }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({
  currentStep,
  onStepClick,
  skipPricing = false,
}: {
  currentStep: number;
  onStepClick: (step: number) => void;
  skipPricing?: boolean;
}): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        marginBottom: '2rem',
      }}
    >
      {STEP_LABELS.map((label, idx) => {
        const stepNum = idx + 1;
        const isSkipped = skipPricing && stepNum === 3;
        const isCompleted = isSkipped ? false : stepNum < currentStep;
        const isCurrent = isSkipped ? false : stepNum === currentStep;
        const isClickable = isCompleted && !isSkipped;

        return (
          <React.Fragment key={stepNum}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
              <button
                type="button"
                onClick={() => isClickable && onStepClick(stepNum)}
                disabled={!isClickable}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: `2px solid ${isCompleted || isCurrent ? 'var(--accent-primary)' : 'var(--border)'}`,
                  background: isCompleted || isCurrent
                    ? 'var(--accent-primary)'
                    : 'var(--bg-secondary)',
                  color: isCompleted || isCurrent ? 'var(--bg-primary)' : 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isClickable ? 'pointer' : 'default',
                  transition: 'background 0.2s, border-color 0.2s',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {isCompleted ? <Check size={16} /> : isSkipped ? '—' : stepNum}
              </button>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: isCurrent ? 600 : 400,
                  color: isSkipped ? 'var(--text-tertiary)' : isCurrent ? 'var(--accent-primary)' : isCompleted ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                  whiteSpace: 'nowrap',
                  textDecoration: isSkipped ? 'line-through' : 'none',
                  opacity: isSkipped ? 0.5 : 1,
                }}
              >
                {label}
              </span>
            </div>
            {idx < STEP_LABELS.length - 1 && (
              <div
                style={{
                  width: '60px',
                  height: '2px',
                  background: stepNum < currentStep ? 'var(--accent-primary)' : 'var(--border)',
                  transition: 'background 0.2s',
                  marginBottom: '1.25rem',
                  flexShrink: 0,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── New Venue Modal ──────────────────────────────────────────────────────────

function NewVenueModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (venue: Venue) => void;
}): React.ReactElement {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<NewVenueFormValues>({
    resolver: zodResolver(newVenueSchema),
    defaultValues: { name: '', address: '', city: '', state: '', zipCode: '', capacity: '' },
  });

  const watchedValues = watch();

  async function onSubmit(values: NewVenueFormValues): Promise<void> {
    setSubmitting(true);
    try {
      const payload: Record<string, string | number | undefined> = {
        name: values.name,
        address: values.address,
        city: values.city,
        state: values.state,
        zipCode: values.zipCode,
      };
      if (values.capacity && !isNaN(Number(values.capacity))) {
        payload.capacity = Number(values.capacity);
      }
      const res = await apiClient.post<Venue>('/admin/venues', payload);
      toast.success('Venue created');
      onCreated(res.data);
    } catch {
      toast.error('Failed to create venue');
    } finally {
      setSubmitting(false);
    }
  }

  function strVal(key: keyof NewVenueFormValues): string {
    const v = watchedValues[key];
    return v !== undefined && v !== null ? String(v) : '';
  }

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
        zIndex: 300,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
          padding: '1.5rem',
          maxWidth: '480px',
          width: '100%',
          boxShadow: 'var(--shadow-card-hover)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Create New Venue
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              padding: '0.25rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <FloatingInput
              fieldId="new-venue-name"
              label="Venue Name *"
              type="text"
              value={strVal('name')}
              error={errors.name?.message}
              {...register('name')}
            />
            <FloatingInput
              fieldId="new-venue-address"
              label="Address *"
              type="text"
              value={strVal('address')}
              error={errors.address?.message}
              {...register('address')}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 140px', gap: '0.625rem' }}>
              <FloatingInput
                fieldId="new-venue-city"
                label="City *"
                type="text"
                value={strVal('city')}
                error={errors.city?.message}
                {...register('city')}
              />
              <FloatingInput
                fieldId="new-venue-state"
                label="State *"
                type="text"
                maxLength={2}
                value={strVal('state')}
                error={errors.state?.message}
                {...register('state')}
              />
              <FloatingInput
                fieldId="new-venue-zip"
                label="ZIP *"
                type="text"
                value={strVal('zipCode')}
                error={errors.zipCode?.message}
                {...register('zipCode')}
              />
            </div>
            <FloatingInput
              fieldId="new-venue-capacity"
              label="Capacity"
              type="number"
              min={1}
              value={strVal('capacity')}
              {...register('capacity')}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
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
              disabled={submitting}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'var(--accent-primary)',
                color: 'var(--bg-primary)',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: 600,
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Creating…' : 'Create Venue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Step 2 Layout Panel ──────────────────────────────────────────────────────

interface Step2LayoutPanelProps {
  watchedLayoutMode: string | undefined;
  maxCapacityValue: string;
  layoutModeError: string | undefined;
  maxCapacityError: string | undefined;
  onLayoutModeChange: (v: LayoutMode) => void;
  onMaxCapacityChange: (v: string) => void;
  eventId: string | null;
  isEdit: boolean;
}


function Step2LayoutPanel({
  watchedLayoutMode,
  maxCapacityValue,
  layoutModeError,
  maxCapacityError,
  onLayoutModeChange,
  onMaxCapacityChange,
  eventId,
  isEdit,
}: Step2LayoutPanelProps): React.ReactElement {
  const isAssignedSeating = watchedLayoutMode === 'Grid';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
        Layout Mode
      </h2>
      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        Choose how your event seats and capacity will be managed.
      </p>

      {layoutModeError && (
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-error)' }}>{layoutModeError}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
        {(
          [
            {
              value: 'Grid' as LayoutMode,
              icon: <Grid3X3 size={28} />,
              title: 'Assigned Seating',
              subtitle: 'Tables & seats on an interactive floor plan',
              desc: 'Best for galas, dinners, restaurant events',
            },
            {
              value: 'CapacityOnly' as LayoutMode,
              icon: <Users size={28} />,
              title: 'General Admission',
              subtitle: 'Capacity-based, no assigned seats',
              desc: 'Best for concerts, festivals, open events',
            },
            {
              value: 'None' as LayoutMode,
              icon: <Ticket size={28} />,
              title: 'Tickets Only',
              subtitle: 'Simple ticketed access',
              desc: 'Best for online events, workshops',
            },
          ] as const
        ).map((card) => {
          const isSelected = watchedLayoutMode === card.value;
          return (
            <button
              key={card.value}
              type="button"
              onClick={() => onLayoutModeChange(card.value)}
              style={{
                padding: '1.25rem',
                borderRadius: '0.75rem',
                border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border)'}`,
                background: isSelected
                  ? 'color-mix(in srgb, var(--accent-primary) 8%, var(--bg-secondary))'
                  : 'var(--bg-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
                transition: 'border-color 0.2s, background 0.2s',
                fontFamily: 'var(--font-body)',
              }}
            >
              <span style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                {card.icon}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)', display: 'block' }}>
                {card.title}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', lineHeight: 1.4 }}>
                {card.subtitle}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', lineHeight: 1.4 }}>
                {card.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Max capacity for CapacityOnly */}
      {watchedLayoutMode === 'CapacityOnly' && (
        <div style={{ position: 'relative', marginTop: '0.25rem' }}>
          <input
            id="maxCapacity-step2"
            type="number"
            min={1}
            value={maxCapacityValue}
            onChange={(e) => onMaxCapacityChange(e.target.value)}
            placeholder=" "
            style={{
              width: '100%',
              padding: '1.375rem 0.875rem 0.5rem',
              borderRadius: '0.5rem',
              border: `1px solid ${maxCapacityError ? 'var(--color-error)' : 'var(--border)'}`,
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <label htmlFor="maxCapacity-step2" style={{ position: 'absolute', left: '0.875rem', top: '0.35rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', pointerEvents: 'none', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Max Capacity *
          </label>
          {maxCapacityError && <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-error)' }}>{maxCapacityError}</p>}
        </div>
      )}

      {/* Floor plan editor for Assigned Seating */}
      {isAssignedSeating && (
        <div style={{ marginTop: '0.5rem' }}>
          {/* Grid Editor */}
          {(isEdit && eventId) ? (
            <Suspense fallback={
              <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: '0.75rem', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                Loading editor…
              </div>
            }>
              <GridEditor eventId={eventId} />
            </Suspense>
          ) : (
            <div
              style={{
                padding: '1.5rem',
                border: '1px dashed var(--border)',
                borderRadius: '0.75rem',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: '0.875rem',
              }}
            >
              Save event basics first to enable the floor plan editor.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EventWizardPage(): React.ReactElement {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const {
    step,
    formData,
    editingEventTitle,
    setStep,
    setFormData,
    setEditingEvent,
    reset,
  } = useEventWizardStore();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [showNewVenueModal, setShowNewVenueModal] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);

  const {
    register,
    trigger,
    watch,
    setValue,
    reset: resetForm,
    formState: { errors },
  } = useForm<WizardFormValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      startDate: formData.startDate,
      startTime: formData.startTime,
      endDate: formData.endDate,
      endTime: formData.endTime,
      venueId: formData.venueId,
      bannerImageUrl: formData.bannerImageUrl,
      layoutMode: (formData.layoutMode as 'Grid' | 'CapacityOnly' | 'None') || undefined,
      maxCapacity: formData.maxCapacity,
      platformFeePercent: formData.platformFeePercent,
      isFeatured: formData.isFeatured,
    },
  });

  const watchedValues = watch();

  // Fetch venues
  useEffect(() => {
    let cancelled = false;
    async function loadVenues(): Promise<void> {
      try {
        const res = await apiClient.get<VenueListResponse>('/admin/venues', { params: { pageSize: 100 } });
        if (!cancelled) setVenues(res.data.items);
      } catch {
        if (!cancelled) toast.error('Failed to load venues');
      } finally {
        if (!cancelled) setVenuesLoading(false);
      }
    }
    void loadVenues();
    return () => { cancelled = true; };
  }, []);

  // Fetch event for edit mode
  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    async function loadEvent(): Promise<void> {
      try {
        const res = await apiClient.get<EventApiObject>(`/admin/events/${id}`);
        if (cancelled) return;
        const e = res.data;

        const startDt = e.startDate ? new Date(e.startDate) : null;
        const endDt = e.endDate ? new Date(e.endDate) : null;

        const startDateStr = startDt ? startDt.toISOString().slice(0, 10) : '';
        const startTimeStr = startDt ? startDt.toISOString().slice(11, 16) : '';
        const endDateStr = endDt ? endDt.toISOString().slice(0, 10) : '';
        const endTimeStr = endDt ? endDt.toISOString().slice(11, 16) : '';

        const newVals: WizardFormValues = {
          title: e.title ?? '',
          description: e.description ?? '',
          category: e.category ?? '',
          startDate: startDateStr,
          startTime: startTimeStr,
          endDate: endDateStr,
          endTime: endTimeStr,
          venueId: e.venueId ?? '',
          bannerImageUrl: e.bannerImageUrl ?? '',
          layoutMode: e.layoutMode ?? 'None',
          maxCapacity: e.maxCapacity != null ? String(e.maxCapacity) : '',
          platformFeePercent: e.platformFeePercent != null ? String(e.platformFeePercent) : '',
          isFeatured: e.isFeatured ?? false,
        };

        resetForm(newVals);
        setFormData({
          title: newVals.title,
          description: newVals.description,
          category: newVals.category,
          startDate: newVals.startDate,
          startTime: newVals.startTime,
          endDate: newVals.endDate,
          endTime: newVals.endTime,
          venueId: newVals.venueId,
          bannerImageUrl: newVals.bannerImageUrl ?? '',
          layoutMode: newVals.layoutMode ?? '',
          maxCapacity: newVals.maxCapacity ?? '',
          platformFeePercent: newVals.platformFeePercent ?? '',
          isFeatured: newVals.isFeatured ?? false,
        });
        setEditingEvent(e.id, e.title);
      } catch {
        if (!cancelled) toast.error('Failed to load event');
      } finally {
        if (!cancelled) setFetchLoading(false);
      }
    }
    void loadEvent();
    return () => { cancelled = true; };
  }, [id, isEdit, resetForm, setFormData, setEditingEvent]);

  // Reset wizard on mount for new events
  useEffect(() => {
    if (!isEdit) {
      reset();
      resetForm({
        title: '',
        description: '',
        category: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        venueId: '',
        bannerImageUrl: '',
        layoutMode: undefined,
        maxCapacity: '',
        platformFeePercent: '',
        isFeatured: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit]);

  // Sync form watcher to store
  useEffect(() => {
    setFormData({
      title: watchedValues.title ?? '',
      description: watchedValues.description ?? '',
      category: watchedValues.category ?? '',
      startDate: watchedValues.startDate ?? '',
      startTime: watchedValues.startTime ?? '',
      endDate: watchedValues.endDate ?? '',
      endTime: watchedValues.endTime ?? '',
      venueId: watchedValues.venueId ?? '',
      bannerImageUrl: watchedValues.bannerImageUrl ?? '',
      layoutMode: watchedValues.layoutMode ?? '',
      maxCapacity: watchedValues.maxCapacity ?? '',
      platformFeePercent: watchedValues.platformFeePercent ?? '',
      isFeatured: watchedValues.isFeatured ?? false,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    watchedValues.title,
    watchedValues.description,
    watchedValues.category,
    watchedValues.startDate,
    watchedValues.startTime,
    watchedValues.endDate,
    watchedValues.endTime,
    watchedValues.venueId,
    watchedValues.bannerImageUrl,
    watchedValues.layoutMode,
    watchedValues.maxCapacity,
    watchedValues.platformFeePercent,
    watchedValues.isFeatured,
  ]);

  async function handleNext(): Promise<void> {
    let fieldsToValidate: (keyof WizardFormValues)[] = [];

    if (step === 1) {
      fieldsToValidate = [
        'title', 'description', 'category',
        'startDate', 'startTime', 'endDate', 'endTime',
        'venueId',
      ];
    } else if (step === 2) {
      fieldsToValidate = ['layoutMode'];
      if (watchedValues.layoutMode === 'CapacityOnly') {
        fieldsToValidate.push('maxCapacity');
      }
    } else if (step === 3 && id) {
      // Validate: at least one active pricing rule must exist
      try {
        const res = await apiClient.get<Array<{ id: string; isActive: boolean; type: string }>>(
          `/admin/events/${id}/pricing`
        );
        const activeRules = res.data.filter((r) => r.isActive);
        if (activeRules.length === 0) {
          toast.error('Add at least one active pricing rule before continuing.');
          return;
        }
        const hasStandard = activeRules.some((r) => r.type === 'Standard');
        if (!hasStandard) {
          toast('No Standard pricing rule found. Consider adding one for default ticket pricing.', {
            icon: '⚠️',
          });
        }
      } catch {
        toast.error('Could not validate pricing rules. Please try again.');
        return;
      }
    }

    const valid = await trigger(fieldsToValidate);
    if (!valid) return;

    // Grid layout: skip pricing step (pricing is per-table in the layout editor)
    const isGrid = watchedValues.layoutMode === 'Grid';
    if (step === 2 && isGrid) {
      setStep(4); // skip step 3, go to review
    } else {
      setStep(step + 1);
    }
  }

  function handleBack(): void {
    // Grid layout: skip pricing step going backwards too
    const isGrid = watchedValues.layoutMode === 'Grid';
    if (step === 4 && isGrid) {
      setStep(2); // skip step 3, go back to layout
    } else {
      setStep(step - 1);
    }
  }

  function handleStepClick(s: number): void {
    // Grid layout: don't allow clicking step 3
    const isGrid = watchedValues.layoutMode === 'Grid';
    if (s === 3 && isGrid) return;
    setStep(s);
  }

  function handleVenueCreated(venue: Venue): void {
    setVenues((prev) => [...prev, venue]);
    setValue('venueId', venue.id);
    setShowNewVenueModal(false);
  }

  const selectedVenue = venues.find((v) => v.id === watchedValues.venueId);
  const descLen = (watchedValues.description ?? '').length;

  if (fetchLoading) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: '48px',
                borderRadius: '0.5rem',
                background: 'var(--bg-tertiary)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
      </div>
    );
  }

  // Step 2 with Assigned Seating needs full width for the layout editor
  const isFullWidthStep = step === 2 && watchedValues.layoutMode === 'Grid';

  return (
    <div style={{ maxWidth: isFullWidthStep ? '100%' : '720px', margin: '0 auto', transition: 'max-width 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          {isEdit ? `Editing: ${editingEventTitle ?? 'Event'}` : 'Create New Event'}
        </h1>
        {isEdit && (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
            Update the event details below
          </p>
        )}
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={step} onStepClick={handleStepClick} skipPricing={watchedValues.layoutMode === 'Grid'} />

      {/* Card — uses reduced padding when editor is full width */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '0.875rem',
          padding: isFullWidthStep ? '1rem' : '1.75rem',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* ── Step 1: Basics ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
              Event Basics
            </h2>

            {/* Title */}
            <FloatingInput
              fieldId="title"
              label="Title *"
              type="text"
              value={watchedValues.title ?? ''}
              error={errors.title?.message}
              {...register('title')}
            />

            {/* Description */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <textarea
                  id="description"
                  {...register('description')}
                  placeholder=" "
                  maxLength={500}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '1.375rem 0.875rem 0.625rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${errors.description ? 'var(--color-error)' : 'var(--border)'}`,
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--accent-primary) 18%, transparent)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = errors.description ? 'var(--color-error)' : 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <label
                  htmlFor="description"
                  style={{
                    position: 'absolute',
                    left: '0.875rem',
                    top: descLen > 0 ? '0.35rem' : '0.9rem',
                    fontSize: descLen > 0 ? '0.7rem' : '0.875rem',
                    fontWeight: descLen > 0 ? 600 : 400,
                    color: errors.description ? 'var(--color-error)' : 'var(--text-tertiary)',
                    transition: 'top 0.15s ease, font-size 0.15s ease',
                    pointerEvents: 'none',
                    textTransform: descLen > 0 ? 'uppercase' : 'none',
                    letterSpacing: descLen > 0 ? '0.04em' : 'normal',
                  }}
                >
                  Description *
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                {errors.description ? (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.description.message}</p>
                ) : <span />}
                <span style={{ fontSize: '0.75rem', color: descLen >= 490 ? 'var(--color-error)' : 'var(--text-tertiary)' }}>
                  {descLen}/500
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.375rem' }}
              >
                Category *
              </label>
              <select
                id="category"
                {...register('category')}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${errors.category ? 'var(--color-error)' : 'var(--border)'}`,
                  background: 'var(--bg-secondary)',
                  color: watchedValues.category ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select category…</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.category.message}</p>
              )}
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Start Date *</label>
                <input
                  type="date"
                  {...register('startDate')}
                  style={dateInputStyle(Boolean(errors.startDate))}
                />
                {errors.startDate && <p style={errorStyle}>{errors.startDate.message}</p>}
              </div>
              <div>
                <label style={labelStyle}>Start Time *</label>
                <input
                  type="time"
                  {...register('startTime')}
                  style={dateInputStyle(Boolean(errors.startTime))}
                />
                {errors.startTime && <p style={errorStyle}>{errors.startTime.message}</p>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>End Date *</label>
                <input
                  type="date"
                  {...register('endDate')}
                  style={dateInputStyle(Boolean(errors.endDate))}
                />
                {errors.endDate && <p style={errorStyle}>{errors.endDate.message}</p>}
              </div>
              <div>
                <label style={labelStyle}>End Time *</label>
                <input
                  type="time"
                  {...register('endTime')}
                  style={dateInputStyle(Boolean(errors.endTime))}
                />
                {errors.endTime && <p style={errorStyle}>{errors.endTime.message}</p>}
              </div>
            </div>

            {/* Venue */}
            <div>
              <label
                htmlFor="venueId"
                style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.375rem' }}
              >
                Venue *
              </label>
              {venuesLoading ? (
                <div style={{ height: '42px', borderRadius: '0.5rem', background: 'var(--bg-tertiary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ) : (
                <select
                  id="venueId"
                  {...register('venueId')}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${errors.venueId ? 'var(--color-error)' : 'var(--border)'}`,
                    background: 'var(--bg-secondary)',
                    color: watchedValues.venueId ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Select venue…</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} — {v.city}, {v.state}
                    </option>
                  ))}
                </select>
              )}
              {errors.venueId && <p style={errorStyle}>{errors.venueId.message}</p>}

              {/* Selected venue info */}
              {selectedVenue && (
                <p style={{ margin: '0.375rem 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {selectedVenue.city}, {selectedVenue.state}
                </p>
              )}

              {/* Create venue link */}
              <button
                type="button"
                onClick={() => setShowNewVenueModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--accent-primary)',
                  fontSize: '0.8125rem',
                  fontFamily: 'var(--font-body)',
                  padding: '0.375rem 0',
                  textDecoration: 'underline',
                  marginTop: '0.25rem',
                }}
              >
                Or create a new venue
              </button>
            </div>

            {/* Banner image URL */}
            <FloatingInput
              fieldId="bannerImageUrl"
              label="Banner Image URL (optional)"
              type="url"
              value={watchedValues.bannerImageUrl ?? ''}
              error={errors.bannerImageUrl?.message}
              {...register('bannerImageUrl')}
            />

            {/* Featured */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
              }}
            >
              <input
                type="checkbox"
                {...register('isFeatured')}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
              Feature this event on the homepage
            </label>
          </div>
        )}

        {/* ── Step 2: Layout Mode ────────────────────────────────────────── */}
        {step === 2 && (
          <Step2LayoutPanel
            watchedLayoutMode={watchedValues.layoutMode}
            maxCapacityValue={watchedValues.maxCapacity ?? ''}
            layoutModeError={errors.layoutMode?.message}
            maxCapacityError={errors.maxCapacity?.message}
            onLayoutModeChange={(v) => setValue('layoutMode', v, { shouldValidate: true })}
            onMaxCapacityChange={(v) => setValue('maxCapacity', v, { shouldValidate: true })}
            eventId={id ?? null}
            isEdit={isEdit}
          />
        )}

        {/* ── Step 3: Pricing ────────────────────────────────────────────── */}
        {step === 3 && (
          <Suspense
            fallback={
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  padding: '1rem 0',
                }}
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: '80px',
                      borderRadius: '0.75rem',
                      background: 'var(--bg-tertiary)',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                  />
                ))}
              </div>
            }
          >
            <PricingStep
              eventId={id ?? null}
              layoutMode={(watchedValues.layoutMode as 'Grid' | 'CapacityOnly' | 'None') ?? 'None'}
              maxCapacity={
                watchedValues.maxCapacity && !isNaN(Number(watchedValues.maxCapacity))
                  ? Number(watchedValues.maxCapacity)
                  : undefined
              }
            />
          </Suspense>
        )}

        {/* ── Step 4: Review ─────────────────────────────────────────────── */}
        {step === 4 && (
          <Suspense
            fallback={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: '90px',
                      borderRadius: '0.875rem',
                      background: 'var(--bg-tertiary)',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                  />
                ))}
              </div>
            }
          >
            <ReviewStep
              eventId={id ?? null}
              formData={formData}
              onGoToStep={handleStepClick}
            />
          </Suspense>
        )}

        {/* ── Navigation buttons ──────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.6rem 1.25rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)',
              color: step === 1 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
              cursor: step === 1 ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              opacity: step === 1 ? 0.5 : 1,
            }}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => void handleNext()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.6rem 1.375rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'var(--accent-primary)',
                color: 'var(--bg-primary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            /* Step 4 ReviewStep renders its own Save/Publish buttons */
            <span />
          )}
        </div>
      </div>

      {/* New venue modal */}
      {showNewVenueModal && (
        <NewVenueModal
          onClose={() => setShowNewVenueModal(false)}
          onCreated={handleVenueCreated}
        />
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
    </div>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '0.375rem',
};

function dateInputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '0.625rem 0.875rem',
    borderRadius: '0.5rem',
    border: `1px solid ${hasError ? 'var(--color-error)' : 'var(--border)'}`,
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  };
}

const errorStyle: React.CSSProperties = {
  margin: '0.25rem 0 0',
  fontSize: '0.75rem',
  color: 'var(--color-error)',
};
