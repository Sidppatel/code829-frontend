import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { User, MapPin, Phone, CheckCircle2, ArrowRight } from 'lucide-react';
import apiClient from '../lib/axios';
import { useAuthStore } from '../stores/authStore';

// ─── Nominatim Types & Helpers ───────────────────────────────────────────────

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
  if (!state) return '';
  if (state.length === 2) return state.toUpperCase();
  return STATE_ABBR[state.toLowerCase()] ?? state.slice(0, 2).toUpperCase();
}

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const onboardingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().max(2).optional().or(z.literal('')),
  zipCode: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  optInLocationEmail: z.boolean(),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

// ─── AddressAutocomplete Component ───────────────────────────────────────────

interface AddressAutocompleteProps {
  value: string;
  error?: string;
  onAddressChange: (addr: ParsedAddress) => void;
  onRawChange: (value: string) => void;
}

function AddressAutocomplete({ value, error, onAddressChange, onRawChange }: AddressAutocompleteProps): React.ReactElement {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleInputChange(newValue: string): void {
    setQuery(newValue);
    onRawChange(newValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (newValue.length < 3) { setSuggestions([]); setShowDropdown(false); return; }
    
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(newValue)}&format=json&addressdetails=1`
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data.slice(0, 5));
        setShowDropdown(data.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 400);
  }

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

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <MapPin size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: focused ? 'var(--accent-primary)' : 'var(--text-tertiary)', zIndex: 10 }} />
        <input
          type="text"
          placeholder="Street Address"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { setFocused(true); if (suggestions.length > 0) setShowDropdown(true); }}
          onBlur={() => setFocused(false)}
          autoComplete="off"
          style={{
            ...inputStyle(!!error),
            paddingLeft: '2.75rem',
            borderRadius: showDropdown ? '0.875rem 0.875rem 0 0' : '0.875rem',
          }}
        />
      </div>
      
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderTop: 'none',
            borderRadius: '0 0 0.875rem 0.875rem',
            boxShadow: 'var(--shadow-card-hover)',
            zIndex: 100,
            maxHeight: '200px',
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
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderTop: '1px solid var(--border)',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {street || s.display_name.split(',')[0]}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {[city, state, a.postcode].filter(Boolean).join(', ')}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Onboarding Screen ──────────────────────────────────────────────────

export default function OnboardingScreen(): React.ReactElement {
  const { user, fetchMe } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: user?.name || '',
      optInLocationEmail: true,
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
    },
  });

  const watchedValues = watch();

  async function onSubmit(data: OnboardingValues) {
    setLoading(true);
    try {
      await apiClient.put('/auth/profile', data);
      toast.success('Welcome aboard! Profile completed.');
      await fetchMe();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '40%',
          height: '40%',
          background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-primary) 15%, transparent) 0%, transparent 70%)',
          filter: 'blur(60px)',
          zIndex: -1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '40%',
          height: '40%',
          background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-secondary) 10%, transparent) 0%, transparent 70%)',
          filter: 'blur(60px)',
          zIndex: -1,
        }}
      />

      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '1.5rem',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-card-hover)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '1rem',
              background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <User size={32} />
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 0.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            Almost there!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Tell us a bit more about yourself to personalize your experience.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                {...register('name')}
                placeholder="John Doe"
                style={inputStyle(!!errors.name)}
              />
            </div>
            {errors.name && <p style={errorStyle}>{errors.name.message}</p>}
          </div>

          {/* Phone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Phone Number (Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                {...register('phone')}
                placeholder="+1 (555) 000-0000"
                style={inputStyle(!!errors.phone)}
              />
            </div>
            {errors.phone && <p style={errorStyle}>{errors.phone.message}</p>}
          </div>

          {/* Address Autocomplete */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Street Address (Optional)
            </label>
            <AddressAutocomplete
              value={watchedValues.address || ''}
              error={errors.address?.message}
              onRawChange={(v) => setValue('address', v, { shouldValidate: true })}
              onAddressChange={(addr) => {
                setValue('address', addr.street, { shouldValidate: true });
                setValue('city', addr.city, { shouldValidate: true });
                setValue('state', addr.state, { shouldValidate: true });
                setValue('zipCode', addr.zipCode, { shouldValidate: true });
              }}
            />
            {errors.address && <p style={errorStyle}>{errors.address.message}</p>}
          </div>

          {/* City State Zip */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input {...register('city')} placeholder="City" style={inputStyle(!!errors.city, true)} />
              {errors.city && <p style={errorStyle}>{errors.city.message}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input {...register('state')} placeholder="ST" maxLength={2} style={inputStyle(!!errors.state, true)} />
              {errors.state && <p style={errorStyle}>{errors.state.message}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input {...register('zipCode')} placeholder="ZIP" style={inputStyle(!!errors.zipCode, true)} />
              {errors.zipCode && <p style={errorStyle}>{errors.zipCode.message}</p>}
            </div>
          </div>

          {/* Email Opt-in */}
          <div
            style={{
              padding: '1.25rem',
              background: 'var(--bg-tertiary)',
              borderRadius: '1rem',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              const checkbox = e.currentTarget.querySelector('input');
              if (checkbox) checkbox.click();
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '0.125rem' }}>
              <input
                type="checkbox"
                {...register('optInLocationEmail')}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: '2px solid var(--border)',
                  appearance: 'none',
                  background: 'var(--bg-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                id="opt-in-check"
                className="custom-checkbox"
                onClick={(e) => e.stopPropagation()}
              />
              <CheckCircle2
                size={14}
                style={{
                  position: 'absolute',
                  left: '3px',
                  top: '3px',
                  color: 'var(--bg-primary)',
                  pointerEvents: 'none',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
                className="checkbox-icon"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label htmlFor="opt-in-check" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                Event Notifications
              </label>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                Get notified when new events are posted in <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{user?.city || 'your area'}</span>.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              padding: '1rem',
              borderRadius: '1rem',
              border: 'none',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              boxShadow: '0 4px 12px color-mix(in srgb, var(--accent-primary) 30%, transparent)',
              transition: 'transform 0.2s, opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {loading ? 'Saving Profile...' : 'Complete Setup'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>
      </div>

      <style>{`
        .custom-checkbox:checked {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
        }
        .custom-checkbox:checked + .checkbox-icon {
          opacity: 1;
        }
        input:focus {
          border-color: var(--accent-primary) !important;
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent-primary) 10%, transparent) !important;
        }
      `}</style>
    </div>
  );
}

const inputStyle = (hasError: boolean, smallPadding = false): React.CSSProperties => ({
  width: '100%',
  padding: smallPadding ? '0.75rem 1rem' : '0.75rem 1rem 0.75rem 2.75rem',
  borderRadius: '0.875rem',
  border: `1px solid ${hasError ? 'var(--color-error)' : 'var(--border)'}`,
  background: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.925rem',
  outline: 'none',
  transition: 'all 0.2s',
  boxSizing: 'border-box',
});

// For city/state/zip
const errorStyle: React.CSSProperties = {
  margin: '0.25rem 0 0',
  fontSize: '0.75rem',
  color: 'var(--color-error)',
};
