import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Input, Spin } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';

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
    county?: string;
  };
}

export interface AddressParts {
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (parts: AddressParts) => void;
  placeholder?: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const DEBOUNCE_MS = 400;

const US_STATES: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
};

function toStateAbbr(state: string): string {
  if (!state) return '';
  if (state.length === 2) return state.toUpperCase();
  return US_STATES[state] ?? state;
}

/** Build a short display label: "600 Townsend Circle, Chickasaw, AL 36611" */
function formatSuggestion(result: NominatimResult): string {
  const addr = result.address;
  const street = [addr.house_number, addr.road].filter(Boolean).join(' ');
  const city = addr.city || addr.town || addr.village || '';
  const state = toStateAbbr(addr.state ?? '');
  const zip = addr.postcode ?? '';

  const parts: string[] = [];
  if (street) parts.push(street);
  if (city) parts.push(city);
  if (state && zip) parts.push(`${state} ${zip}`);
  else if (state) parts.push(state);
  else if (zip) parts.push(zip);

  return parts.join(', ');
}

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder }: Props) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const updateDropdownPosition = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateDropdownPosition();
    window.addEventListener('scroll', updateDropdownPosition, true);
    window.addEventListener('resize', updateDropdownPosition);
    return () => {
      window.removeEventListener('scroll', updateDropdownPosition, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [open, updateDropdownPosition]);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        countrycodes: 'us',
      });
      const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
        headers: { 'Accept-Language': 'en' },
      });
      if (res.ok) {
        const data = (await res.json()) as NominatimResult[];
        setSuggestions(data);
        setOpen(data.length > 0);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange?.(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(val);
    }, DEBOUNCE_MS);
  };

  const handleSelect = (result: NominatimResult) => {
    const addr = result.address;
    const street = [addr.house_number, addr.road].filter(Boolean).join(' ');
    const city = addr.city || addr.town || addr.village || addr.county || '';
    const stateAbbr = toStateAbbr(addr.state ?? '');
    const zip = addr.postcode || '';

    onChange?.(street);
    onSelect?.({ address: street, city, state: stateAbbr, zipCode: zip });
    setSuggestions([]);
    setOpen(false);
  };

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 200);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <Input
        value={value}
        onChange={handleChange}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        onBlur={handleBlur}
        placeholder={placeholder ?? 'Start typing an address...'}
        prefix={<EnvironmentOutlined style={{ color: 'var(--text-muted)' }} />}
        suffix={loading ? <Spin size="small" /> : null}
      />
      {open && suggestions.length > 0 && createPortal(
        <div className="address-autocomplete-dropdown" style={dropdownStyle}>
          {suggestions.map((s) => (
            <div
              key={s.place_id}
              className="address-autocomplete-item"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s)}
            >
              <EnvironmentOutlined style={{ color: 'var(--accent-violet)', flexShrink: 0, marginTop: 2 }} />
              <span>{formatSuggestion(s)}</span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
