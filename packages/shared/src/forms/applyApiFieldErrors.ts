import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

interface ApiErrorShape {
  response?: {
    data?: {
      message?: string;
      errors?: Record<string, string[] | string>;
    };
  };
}

/**
 * Maps backend ApiError.errors (per-field validation errors) onto RHF setError so
 * field-level messages appear under the matching input. Returns the top-level
 * message (or null) for surfacing at the form level.
 */
export function applyApiFieldErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
): string | null {
  const e = err as ApiErrorShape;
  const data = e?.response?.data;
  if (data?.errors) {
    for (const [name, raw] of Object.entries(data.errors)) {
      const message = Array.isArray(raw) ? raw[0] : raw;
      setError(name as Path<T>, { type: 'server', message });
    }
  }
  return data?.message ?? null;
}
