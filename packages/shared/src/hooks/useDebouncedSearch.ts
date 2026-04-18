import { useCallback, useEffect, useState } from 'react';

export interface UseDebouncedSearchResult {
  value: string;
  debouncedValue: string;
  onChange: (v: string | undefined) => void;
  reset: () => void;
}

export function useDebouncedSearch(initial = '', delayMs = 250): UseDebouncedSearchResult {
  const [value, setValue] = useState(initial);
  const [debouncedValue, setDebouncedValue] = useState(initial);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  const onChange = useCallback((v: string | undefined) => setValue(v ?? ''), []);
  const reset = useCallback(() => {
    setValue('');
    setDebouncedValue('');
  }, []);

  return { value, debouncedValue, onChange, reset };
}
