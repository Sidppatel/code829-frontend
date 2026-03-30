import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Check,
  X,
  AlertTriangle,
  Grid3X3,
  Users,
  Ticket,
  Tag,
  CalendarDays,
  MapPin,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';
import type { WizardFormData } from '../../../stores/eventWizardStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LayoutData {
  tables: Array<{ id: string; seats: number }>;
}

interface PricingRule {
  id: string;
  name: string;
  type: 'Standard' | 'EarlyBird' | 'FirstN';
  priceCents: number;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  maxCount: number | null;
  usedCount: number;
}

interface ResolvedPrice {
  priceCents: number;
  ruleName: string;
  ruleType: string;
}

interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
}

export interface ReviewStepProps {
  eventId: string | null;
  formData: WizardFormData;
  onGoToStep: (step: number) => void;
  onSaved?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEventDate(startDate: string, startTime: string, endDate: string, endTime: string): string {
  try {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    const dayOpts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

    const dayStr = start.toLocaleDateString('en-US', dayOpts);
    const startTimeStr = start.toLocaleTimeString('en-US', timeOpts);
    const endTimeStr = end.toLocaleTimeString('en-US', timeOpts);

    return `${dayStr} · ${startTimeStr} – ${endTimeStr}`;
  } catch {
    return `${startDate} ${startTime} – ${endDate} ${endTime}`;
  }
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function layoutModeLabel(mode: string): string {
  if (mode === 'Grid') return 'Assigned Seating';
  if (mode === 'CapacityOnly') return 'General Admission';
  if (mode === 'None') return 'Tickets Only';
  return mode;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--border)',
        borderRadius: '0.875rem',
        overflow: 'hidden',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          background: 'color-mix(in srgb, var(--bg-tertiary) 60%, transparent)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {title}
        </span>
        <button
          type="button"
          onClick={onEdit}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem 0.625rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--accent-primary)',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            fontWeight: 600,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--accent-primary) 8%, var(--bg-secondary))';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-secondary)';
          }}
        >
          Edit
          <ChevronRight size={12} />
        </button>
      </div>
      <div style={{ padding: '1rem 1.25rem' }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.875rem',
        alignItems: 'flex-start',
        paddingBottom: '0.625rem',
        borderBottom: '1px solid var(--border)',
        marginBottom: '0.625rem',
      }}
    >
      <span
        style={{
          minWidth: '110px',
          fontSize: '0.775rem',
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          paddingTop: '0.1rem',
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', flex: 1 }}>{children}</span>
    </div>
  );
}

function TypeBadge({ type }: { type: string }): React.ReactElement {
  const colors: Record<string, { bg: string; color: string }> = {
    Standard: {
      bg: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
      color: 'var(--accent-primary)',
    },
    EarlyBird: {
      bg: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
      color: 'var(--color-success)',
    },
    FirstN: {
      bg: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
      color: 'var(--color-warning)',
    },
  };
  const style = colors[type] ?? colors['Standard'];

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.5rem',
        borderRadius: '0.375rem',
        fontSize: '0.7rem',
        fontWeight: 700,
        background: style.bg,
        color: style.color,
        letterSpacing: '0.03em',
      }}
    >
      {type === 'EarlyBird' ? 'Early Bird' : type === 'FirstN' ? 'First N' : type}
    </span>
  );
}

// ─── Checklist item ───────────────────────────────────────────────────────────

type CheckStatus = 'pass' | 'fail' | 'warn';

interface CheckItem {
  label: string;
  status: CheckStatus;
  detail?: string;
}

function ChecklistItem({ item }: { item: CheckItem }): React.ReactElement {
  const icon =
    item.status === 'pass' ? (
      <Check size={14} />
    ) : item.status === 'warn' ? (
      <AlertTriangle size={14} />
    ) : (
      <X size={14} />
    );

  const color =
    item.status === 'pass'
      ? 'var(--color-success)'
      : item.status === 'warn'
      ? 'var(--color-warning)'
      : 'var(--color-error)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.625rem',
        padding: '0.5rem 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: `color-mix(in srgb, ${color} 15%, transparent)`,
          color,
          flexShrink: 0,
          marginTop: '0.125rem',
        }}
      >
        {icon}
      </span>
      <div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
          {item.label}
        </div>
        {item.detail && (
          <div style={{ fontSize: '0.775rem', color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>
            {item.detail}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReviewStep({
  eventId,
  formData,
  onGoToStep,
  onSaved,
}: ReviewStepProps): React.ReactElement {
  const navigate = useNavigate();

  const [layoutData, setLayoutData] = useState<LayoutData | null>(null);
  const [layoutLoading, setLayoutLoading] = useState(false);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [resolvedPrice, setResolvedPrice] = useState<ResolvedPrice | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [eventStatus, setEventStatus] = useState<string>('Draft');
  const [descExpanded, setDescExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);

  // Load event + venue data
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const res = await adminApi.events.getById<{
          status: string;
          venueId: string;
          venue?: Venue;
        }>(eventId!);
        if (cancelled) return;
        setEventStatus(res.data.status ?? 'Draft');
        if (res.data.venue) {
          setVenue(res.data.venue);
        } else if (res.data.venueId) {
          try {
            const vRes = await adminApi.venues.getById<Venue>(res.data.venueId);
            if (!cancelled) setVenue(vRes.data);
          } catch {
            // non-fatal
          }
        }
      } catch {
        // non-fatal
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [eventId]);

  // Load layout
  useEffect(() => {
    if (!eventId || formData.layoutMode !== 'Grid') return;
    let cancelled = false;
    setLayoutLoading(true);

    async function loadLayout(): Promise<void> {
      try {
        const res = await adminApi.layout.get<LayoutData>(eventId!);
        if (!cancelled) setLayoutData(res.data);
      } catch {
        // non-fatal
      } finally {
        if (!cancelled) setLayoutLoading(false);
      }
    }

    void loadLayout();
    return () => { cancelled = true; };
  }, [eventId, formData.layoutMode]);

  // Load pricing
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    setPricingLoading(true);

    async function loadPricing(): Promise<void> {
      try {
        const [rulesRes, resolvedRes] = await Promise.all([
          adminApi.pricing.list<PricingRule[]>(eventId!),
          adminApi.pricing.resolve<ResolvedPrice>(eventId!).catch(() => null),
        ]);
        if (!cancelled) {
          setPricingRules(rulesRes.data);
          if (resolvedRes) setResolvedPrice(resolvedRes.data);
        }
      } catch {
        // non-fatal
      } finally {
        if (!cancelled) setPricingLoading(false);
      }
    }

    void loadPricing();
    return () => { cancelled = true; };
  }, [eventId]);

  // ─── Checklist ──────────────────────────────────────────────────────────────

  const activeRules = pricingRules.filter((r) => r.isActive);
  const hasTitle = formData.title.trim().length >= 2;
  const hasDates =
    formData.startDate.length > 0 &&
    formData.startTime.length > 0 &&
    formData.endDate.length > 0 &&
    formData.endTime.length > 0;
  const hasVenue = formData.venueId.trim().length > 0;
  const hasPricing = activeRules.length > 0;
  const isGridMode = formData.layoutMode === 'Grid';
  const hasLayout =
    !isGridMode ||
    (layoutData !== null && layoutData.tables.length > 0);
  const hasBanner = (formData.bannerImageUrl ?? '').trim().length > 0;

  const checks: CheckItem[] = [
    {
      label: 'Event title set',
      status: hasTitle ? 'pass' : 'fail',
      detail: hasTitle ? formData.title : 'Add a title in Step 1',
    },
    {
      label: 'Dates configured',
      status: hasDates ? 'pass' : 'fail',
      detail: hasDates
        ? formatEventDate(formData.startDate, formData.startTime, formData.endDate, formData.endTime)
        : 'Set start and end dates in Step 1',
    },
    {
      label: 'Venue assigned',
      status: hasVenue ? 'pass' : 'fail',
      detail: hasVenue
        ? venue
          ? `${venue.name}, ${venue.city}`
          : 'Venue selected'
        : 'Select a venue in Step 1',
    },
    {
      label: 'At least 1 pricing rule',
      status: hasPricing ? 'pass' : 'fail',
      detail: hasPricing
        ? `${activeRules.length} active rule${activeRules.length > 1 ? 's' : ''}`
        : 'Add pricing rules in Step 3',
    },
    ...(isGridMode
      ? [
          {
            label: 'Layout configured (Assigned Seating)',
            status: hasLayout ? ('pass' as CheckStatus) : ('fail' as CheckStatus),
            detail: hasLayout
              ? `${layoutData?.tables.length ?? 0} tables configured`
              : 'Add tables in the floor plan editor (Step 2)',
          },
        ]
      : []),
    {
      label: 'Banner image',
      status: hasBanner ? 'pass' : 'warn',
      detail: hasBanner ? 'Image URL set' : 'Optional — event will use a default gradient',
    },
  ];

  const blockingFails = checks.filter((c) => c.status === 'fail');
  const canPublish = blockingFails.length === 0;

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async function buildPayload(): Promise<Record<string, string | number | boolean | null | undefined>> {
    const startDateTime = `${formData.startDate}T${formData.startTime}:00`;
    const endDateTime = `${formData.endDate}T${formData.endTime}:00`;

    const payload: Record<string, string | number | boolean | null | undefined> = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      startDate: startDateTime,
      endDate: endDateTime,
      venueId: formData.venueId,
      bannerImageUrl: formData.bannerImageUrl || null,
      layoutMode: formData.layoutMode,
      isFeatured: formData.isFeatured ?? false,
      platformFeePercent: formData.platformFeePercent ? Number(formData.platformFeePercent) : 0,
    };

    if (formData.layoutMode === 'CapacityOnly' && formData.maxCapacity) {
      payload.maxCapacity = Number(formData.maxCapacity);
    }

    return payload;
  }

  async function handleSaveDraft(): Promise<void> {
    if (!eventId) {
      toast.error('No event ID — save basics first');
      return;
    }
    setSaving(true);
    try {
      const payload = await buildPayload();
      await adminApi.events.update(eventId, payload);
      toast.success('Saved as draft');
      onSaved?.();
      navigate('/admin/events');
    } catch {
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(): Promise<void> {
    if (!eventId) return;
    setPublishing(true);
    try {
      const payload = await buildPayload();
      await adminApi.events.update(eventId, payload);
      await adminApi.events.updateStatus(eventId, 'Published');
      toast.success('Event published successfully!');
      onSaved?.();
      navigate('/admin/events');
    } catch {
      toast.error('Failed to publish event');
    } finally {
      setPublishing(false);
    }
  }

  async function handleSchedule(): Promise<void> {
    if (!eventId || !scheduleDate || !scheduleTime) {
      toast.error('Select a schedule date and time');
      return;
    }
    const scheduleAt = new Date(`${scheduleDate}T${scheduleTime}`);
    if (scheduleAt <= new Date()) {
      toast.error('Schedule time must be in the future');
      return;
    }
    setPublishing(true);
    try {
      const payload = await buildPayload();
      await adminApi.events.update(eventId, payload);
      await adminApi.events.updateStatus(eventId, 'Published');
      toast.success('Event scheduled for publish');
      onSaved?.();
      navigate('/admin/events');
    } catch {
      toast.error('Failed to schedule publish');
    } finally {
      setPublishing(false);
    }
  }

  // ─── Layout stats ─────────────────────────────────────────────────────────

  const totalTables = layoutData?.tables.length ?? 0;
  const totalSeats = layoutData?.tables.reduce((sum, t) => sum + (t.seats ?? 0), 0) ?? 0;

  // ─── Description truncation ───────────────────────────────────────────────

  const descFull = formData.description ?? '';
  const descTrunc = descFull.length > 200 ? descFull.slice(0, 200) + '…' : descFull;
  const showToggle = descFull.length > 200;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.2rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 0.25rem',
          }}
        >
          Review & Publish
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Confirm your event details before publishing.
        </p>
      </div>

      {/* Event Details Card */}
      <SectionCard title="Event Details" onEdit={() => onGoToStep(1)}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.3rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 0.625rem',
          }}
        >
          {formData.title || <span style={{ color: 'var(--text-tertiary)' }}>No title</span>}
        </h3>

        <div style={{ marginBottom: '0.75rem' }}>
          <p
            style={{
              margin: '0 0 0.25rem',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            {descExpanded ? descFull : descTrunc}
          </p>
          {showToggle && (
            <button
              type="button"
              onClick={() => setDescExpanded((p) => !p)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              {descExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.875rem' }}>
          {formData.category && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
                color: 'var(--accent-primary)',
                border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)',
              }}
            >
              <Tag size={11} />
              {formData.category}
            </span>
          )}
        </div>

        {formData.startDate && formData.startTime && formData.endDate && formData.endTime && (
          <InfoRow label="Date & Time">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <CalendarDays size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              {formatEventDate(formData.startDate, formData.startTime, formData.endDate, formData.endTime)}
            </span>
          </InfoRow>
        )}

        {venue && (
          <InfoRow label="Venue">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <MapPin size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              {venue.name} · {venue.city}
            </span>
          </InfoRow>
        )}
      </SectionCard>

      {/* Layout Card */}
      <SectionCard title="Layout" onEdit={() => onGoToStep(2)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: 'color-mix(in srgb, var(--text-secondary) 10%, transparent)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            {formData.layoutMode === 'Grid' && <Grid3X3 size={13} />}
            {formData.layoutMode === 'CapacityOnly' && <Users size={13} />}
            {formData.layoutMode === 'None' && <Ticket size={13} />}
            {formData.layoutMode ? layoutModeLabel(formData.layoutMode) : 'Not set'}
          </span>
        </div>

        {formData.layoutMode === 'Grid' && (
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {layoutLoading
              ? 'Loading layout…'
              : layoutData
              ? `${totalTables} table${totalTables !== 1 ? 's' : ''} · ${totalSeats} seat${totalSeats !== 1 ? 's' : ''}`
              : 'No tables configured yet'}
          </p>
        )}

        {formData.layoutMode === 'CapacityOnly' && formData.maxCapacity && (
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Capacity: {formData.maxCapacity} guests
          </p>
        )}

        {formData.layoutMode === 'None' && (
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Ticketed access, no seating plan required.
          </p>
        )}
      </SectionCard>

      {/* Pricing Card */}
      <SectionCard title="Pricing" onEdit={() => onGoToStep(3)}>
        {pricingLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: '36px',
                  borderRadius: '0.375rem',
                  background: 'var(--bg-tertiary)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : activeRules.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-error)' }}>
            No active pricing rules. Add at least one rule in Step 3.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {activeRules.map((rule) => (
              <div
                key={rule.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {rule.name}
                  </span>
                  <TypeBadge type={rule.type} />
                </div>
                <span
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {formatPrice(rule.priceCents)}
                </span>
              </div>
            ))}

            {resolvedPrice && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: 'color-mix(in srgb, var(--accent-primary) 6%, var(--bg-secondary))',
                  border: '1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)',
                  marginTop: '0.25rem',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <DollarSign size={13} />
                  Effective price ({resolvedPrice.ruleName})
                </span>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {formatPrice(resolvedPrice.priceCents)}
                </span>
              </div>
            )}
          </div>
        )}
        <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
      </SectionCard>

      {/* Publish Checklist */}
      <div
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--border)',
          borderRadius: '0.875rem',
          overflow: 'hidden',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            padding: '0.875rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            background: 'color-mix(in srgb, var(--bg-tertiary) 60%, transparent)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Publish Checklist
          </span>
        </div>
        <div style={{ padding: '0.875rem 1.25rem' }}>
          {checks.map((item, i) => (
            <ChecklistItem key={i} item={item} />
          ))}

          <div
            style={{
              marginTop: '0.875rem',
              padding: '0.625rem 0.875rem',
              borderRadius: '0.5rem',
              background: canPublish
                ? 'color-mix(in srgb, var(--color-success) 10%, transparent)'
                : 'color-mix(in srgb, var(--color-error) 10%, transparent)',
              border: `1px solid ${canPublish ? 'color-mix(in srgb, var(--color-success) 25%, transparent)' : 'color-mix(in srgb, var(--color-error) 25%, transparent)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {canPublish ? (
              <Check size={15} style={{ color: 'var(--color-success)' }} />
            ) : (
              <X size={15} style={{ color: 'var(--color-error)' }} />
            )}
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: canPublish ? 'var(--color-success)' : 'var(--color-error)',
              }}
            >
              {canPublish
                ? 'Ready to publish'
                : `Fix ${blockingFails.length} item${blockingFails.length > 1 ? 's' : ''} above`}
            </span>
          </div>
        </div>
      </div>

      {/* Schedule section (edit mode, draft status) */}
      {eventId && eventStatus === 'Draft' && (
        <div>
          <button
            type="button"
            onClick={() => setShowSchedule((p) => !p)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            {showSchedule ? 'Hide schedule options' : 'Schedule publish for later'}
          </button>

          {showSchedule && (
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                marginTop: '0.875rem',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
              }}
            >
              <div style={{ flex: 1, minWidth: '140px' }}>
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
                  Schedule Date
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.875rem',
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
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
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
                  Schedule Time
                </label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.875rem',
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
              </div>
              <button
                type="button"
                onClick={() => void handleSchedule()}
                disabled={publishing || !scheduleDate || !scheduleTime}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: 'var(--accent-primary)',
                  color: 'var(--bg-primary)',
                  cursor: publishing || !scheduleDate || !scheduleTime ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  opacity: publishing || !scheduleDate || !scheduleTime ? 0.6 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {publishing ? 'Scheduling…' : 'Schedule Publish'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          paddingTop: '0.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => void handleSaveDraft()}
          disabled={saving || publishing}
          style={{
            flex: 1,
            minWidth: '140px',
            padding: '0.65rem 1.25rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            cursor: saving || publishing ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            fontWeight: 600,
            opacity: saving ? 0.7 : 1,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!saving && !publishing)
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-secondary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-tertiary)';
          }}
        >
          {saving ? 'Saving…' : 'Save as Draft'}
        </button>

        <button
          type="button"
          onClick={() => void handlePublish()}
          disabled={!canPublish || publishing || saving}
          title={!canPublish ? 'Fix checklist items above before publishing' : undefined}
          style={{
            flex: 2,
            minWidth: '160px',
            padding: '0.65rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: canPublish ? 'var(--accent-cta)' : 'var(--bg-tertiary)',
            color: canPublish ? 'var(--bg-primary)' : 'var(--text-tertiary)',
            cursor: !canPublish || publishing || saving ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            fontWeight: 700,
            opacity: publishing ? 0.7 : 1,
            transition: 'background 0.2s, opacity 0.2s',
          }}
        >
          {publishing ? 'Publishing…' : 'Publish Event'}
        </button>
      </div>
    </div>
  );
}
