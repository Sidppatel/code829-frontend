import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import apiClient from '../../lib/axios';
import { SkeletonLine } from '../../components/Skeleton';

// ─── Zod schema ──────────────────────────────────────────────────────────────

const venueSchema = z.object({
  name: z.string().min(2, 'Min 2 characters').max(256, 'Max 256 characters'),
  address: z.string().min(2, 'Min 2 characters').max(512, 'Max 512 characters'),
  city: z.string().min(2, 'Min 2 characters').max(128, 'Max 128 characters'),
  state: z.string().length(2, 'Must be 2 characters (e.g. CA)'),
  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Must be a valid ZIP code (e.g. 90210 or 90210-1234)'),
  capacity: z
    .union([z.number().positive('Must be positive'), z.nan()])
    .optional()
    .transform((v) => (typeof v === 'number' && !isNaN(v) ? v : undefined)),
  description: z.string().max(4096, 'Max 4096 characters').optional().or(z.literal('')),
  phone: z.string().max(20, 'Max 20 characters').optional().or(z.literal('')),
  website: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
});

type VenueFormValues = z.input<typeof venueSchema>;

interface VenueData {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  capacity: number;
  description: string;
  phone: string;
  website: string;
  isActive: boolean;
}

// ─── FloatingInput ────────────────────────────────────────────────────────────

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  id: string;
}

function FloatingInput({ label, error, id, ...props }: FloatingInputProps): React.ReactElement {
  const [focused, setFocused] = useState(false);
  const hasValue = Boolean(props.value !== undefined ? String(props.value) : '');

  return (
    <div style={{ position: 'relative', marginTop: '0.25rem' }}>
      <input
        id={id}
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
            ? `0 0 0 3px color-mix(in srgb, var(--accent-primary) 18%, transparent)`
            : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxSizing: 'border-box',
          ...props.style,
        }}
      />
      <label
        htmlFor={id}
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

// ─── FloatingTextarea ────────────────────────────────────────────────────────

interface FloatingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  id: string;
}

function FloatingTextarea({ label, error, id, ...props }: FloatingTextareaProps): React.ReactElement {
  const [focused, setFocused] = useState(false);
  const hasValue = Boolean(props.value !== undefined ? String(props.value) : '');

  return (
    <div style={{ position: 'relative', marginTop: '0.25rem' }}>
      <textarea
        id={id}
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        placeholder=" "
        rows={props.rows ?? 4}
        style={{
          width: '100%',
          padding: '1.375rem 0.875rem 0.625rem',
          borderRadius: '0.5rem',
          border: `1px solid ${error ? 'var(--color-error)' : focused ? 'var(--accent-primary)' : 'var(--border)'}`,
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.9rem',
          outline: 'none',
          resize: 'vertical',
          boxShadow: focused
            ? `0 0 0 3px color-mix(in srgb, var(--accent-primary) 18%, transparent)`
            : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxSizing: 'border-box',
          ...props.style,
        }}
      />
      <label
        htmlFor={id}
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

// ─── Address autocomplete (Nominatim / OpenStreetMap — free, no API key) ─────

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country_code?: string;
  };
}

interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

// US state abbreviations lookup
const STATE_ABBR: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI',
  'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
  vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY',
};

function toStateAbbr(state: string): string {
  if (state.length === 2) return state.toUpperCase();
  return STATE_ABBR[state.toLowerCase()] ?? state.slice(0, 2).toUpperCase();
}

interface AddressAutocompleteProps {
  value: string;
  error?: string;
  onAddressChange: (addr: ParsedAddress) => void;
  register: ReturnType<typeof useForm>['register'];
}

function AddressAutocomplete({ value, error, onAddressChange, register: reg }: AddressAutocompleteProps): React.ReactElement {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => { setQuery(value); }, [value]);

  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=us&limit=5&q=${encodeURIComponent(q)}`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        setShowDropdown(data.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 350);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(result: NominatimResult): void {
    const a = result.address;
    const street = [a.house_number, a.road].filter(Boolean).join(' ') || result.display_name.split(',')[0];
    const city = a.city || a.town || a.village || '';
    const state = a.state ? toStateAbbr(a.state) : '';
    const zipCode = a.postcode || '';

    setQuery(street);
    setShowDropdown(false);
    onAddressChange({ street, city, state, zipCode });
  }

  const hasValue = Boolean(query);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative', marginTop: '0.25rem' }}>
        <input
          id="address"
          type="text"
          placeholder=" "
          value={query}
          {...reg('address')}
          onChange={(e) => {
            setQuery(e.target.value);
            reg('address').onChange(e);
            fetchSuggestions(e.target.value);
          }}
          onFocus={() => { setFocused(true); if (suggestions.length > 0) setShowDropdown(true); }}
          onBlur={() => setFocused(false)}
          autoComplete="off"
          style={{
            width: '100%',
            padding: '1.375rem 0.875rem 0.5rem',
            borderRadius: showDropdown ? '0.5rem 0.5rem 0 0' : '0.5rem',
            border: `1px solid ${error ? 'var(--color-error)' : focused ? 'var(--accent-primary)' : 'var(--border)'}`,
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            outline: 'none',
            boxShadow: focused ? '0 0 0 3px color-mix(in srgb, var(--accent-primary) 18%, transparent)' : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
          }}
        />
        <label
          htmlFor="address"
          style={{
            position: 'absolute',
            left: '0.875rem',
            top: focused || hasValue ? '0.35rem' : '0.9rem',
            fontSize: focused || hasValue ? '0.7rem' : '0.875rem',
            fontWeight: focused || hasValue ? 600 : 400,
            color: error ? 'var(--color-error)' : focused ? 'var(--accent-primary)' : 'var(--text-tertiary)',
            transition: 'top 0.15s ease, font-size 0.15s ease, color 0.15s ease',
            pointerEvents: 'none',
            letterSpacing: focused || hasValue ? '0.04em' : 'normal',
            textTransform: focused || hasValue ? 'uppercase' : 'none',
          }}
        >
          Address *
        </label>
      </div>
      {error && (
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-error)' }}>{error}</p>
      )}

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderTop: 'none',
            borderRadius: '0 0 0.5rem 0.5rem',
            boxShadow: 'var(--shadow-card-hover)',
            zIndex: 50,
            maxHeight: '240px',
            overflowY: 'auto',
          }}
        >
          {suggestions.map((s) => {
            const a = s.address;
            const street = [a.house_number, a.road].filter(Boolean).join(' ');
            const city = a.city || a.town || a.village || '';
            const state = a.state ? toStateAbbr(a.state) : '';

            return (
              <button
                key={s.place_id}
                type="button"
                onClick={() => handleSelect(s)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.6rem 0.875rem',
                  border: 'none',
                  borderTop: '1px solid var(--border)',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {street || s.display_name.split(',')[0]}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>
                  {[city, state, a.postcode].filter(Boolean).join(', ')}
                </div>
              </button>
            );
          })}
          <div style={{ padding: '0.3rem 0.875rem', fontSize: '0.6rem', color: 'var(--text-tertiary)', textAlign: 'right' }}>
            Powered by OpenStreetMap
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section divider ─────────────────────────────────────────────────────────

function SectionDivider({ title }: { title: string }): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        margin: '1.75rem 0 1rem',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.9rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </span>
      <div
        style={{
          flex: 1,
          height: '1px',
          background: 'var(--border)',
        }}
      />
    </div>
  );
}

// ─── Main form page ──────────────────────────────────────────────────────────

export default function VenueFormPage(): React.ReactElement {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      capacity: undefined,
      description: '',
      phone: '',
      website: '',
    },
  });

  // Watch values for floating label detection
  const watchedValues = watch();

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    async function fetchVenue(): Promise<void> {
      try {
        const res = await apiClient.get<VenueData>(`/admin/venues/${id}`);
        if (cancelled) return;
        const v = res.data;
        reset({
          name: v.name ?? '',
          address: v.address ?? '',
          city: v.city ?? '',
          state: v.state ?? '',
          zipCode: v.zipCode ?? '',
          capacity: v.capacity > 0 ? v.capacity : undefined,
          description: v.description ?? '',
          phone: v.phone ?? '',
          website: v.website ?? '',
        });
      } catch {
        if (!cancelled) toast.error('Failed to load venue data');
      } finally {
        if (!cancelled) setFetchLoading(false);
      }
    }
    void fetchVenue();
    return () => { cancelled = true; };
  }, [id, isEdit, reset]);

  async function onSubmit(values: VenueFormValues): Promise<void> {
    setSubmitting(true);
    try {
      if (isEdit && id) {
        await apiClient.put(`/admin/venues/${id}`, values);
        toast.success('Venue updated successfully');
      } else {
        await apiClient.post('/admin/venues', values);
        toast.success('Venue created successfully');
      }
      navigate('/admin/venues');
    } catch {
      toast.error(isEdit ? 'Failed to update venue' : 'Failed to create venue');
    } finally {
      setSubmitting(false);
    }
  }

  // Helper: get string value for FloatingInput display
  function strVal(key: keyof VenueFormValues): string {
    const v = watchedValues[key];
    return v !== undefined && v !== null ? String(v) : '';
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 1.5rem',
        }}
      >
        {isEdit ? 'Edit Venue' : 'New Venue'}
      </h1>

      {fetchLoading ? (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonLine key={i} className={i % 3 === 0 ? 'w-full h-12' : 'w-full h-12'} />
          ))}
        </div>
      ) : (
        <form
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          noValidate
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* ── Basic Info ─────────────────────────────────── */}
          <SectionDivider title="Basic Info" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FloatingInput
              id="name"
              label="Name *"
              type="text"
              value={strVal('name')}
              error={errors.name?.message}
              {...register('name')}
            />
            <FloatingTextarea
              id="description"
              label="Description"
              rows={4}
              value={strVal('description')}
              error={errors.description?.message}
              {...register('description')}
            />
          </div>

          {/* ── Location (with Nominatim autocomplete) ───── */}
          <SectionDivider title="Location" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AddressAutocomplete
              value={strVal('address')}
              error={errors.address?.message}
              onAddressChange={(addr) => {
                setValue('address', addr.street, { shouldValidate: true });
                if (addr.city) setValue('city', addr.city, { shouldValidate: true });
                if (addr.state) setValue('state', addr.state, { shouldValidate: true });
                if (addr.zipCode) setValue('zipCode', addr.zipCode, { shouldValidate: true });
              }}
              register={register}
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 140px',
                gap: '0.75rem',
              }}
            >
              <FloatingInput
                id="city"
                label="City *"
                type="text"
                value={strVal('city')}
                error={errors.city?.message}
                {...register('city')}
              />
              <FloatingInput
                id="state"
                label="State *"
                type="text"
                maxLength={2}
                value={strVal('state')}
                error={errors.state?.message}
                {...register('state')}
              />
              <FloatingInput
                id="zipCode"
                label="ZIP Code *"
                type="text"
                value={strVal('zipCode')}
                error={errors.zipCode?.message}
                {...register('zipCode')}
              />
            </div>
          </div>

          {/* ── Contact & Details ──────────────────────────── */}
          <SectionDivider title="Contact & Details" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <FloatingInput
                id="capacity"
                label="Max Capacity"
                type="number"
                min={1}
                value={strVal('capacity')}
                error={errors.capacity?.message}
                {...register('capacity', { valueAsNumber: true })}
              />
              <FloatingInput
                id="phone"
                label="Phone"
                type="tel"
                value={strVal('phone')}
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>
            <FloatingInput
              id="website"
              label="Website URL"
              type="url"
              value={strVal('website')}
              error={errors.website?.message}
              {...register('website')}
            />
          </div>

          {/* ── Form actions ──────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/admin/venues')}
              disabled={submitting}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.6rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'var(--accent-primary)',
                color: 'var(--bg-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Venue'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
