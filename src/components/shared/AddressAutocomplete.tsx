import { useState, useRef, useCallback } from 'react';
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

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder }: Props) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
    const stateAbbr = addr.state || '';
    const zip = addr.postcode || '';

    onChange?.(street);
    onSelect?.({ address: street, city, state: stateAbbr, zipCode: zip });
    setSuggestions([]);
    setOpen(false);
  };

  const handleBlur = () => {
    // Delay to allow click on suggestion
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
      {open && suggestions.length > 0 && (
        <div className="address-autocomplete-dropdown">
          {suggestions.map((s) => (
            <div
              key={s.place_id}
              className="address-autocomplete-item"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s)}
            >
              <EnvironmentOutlined style={{ color: 'var(--accent-violet)', flexShrink: 0, marginTop: 2 }} />
              <span>{s.display_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
