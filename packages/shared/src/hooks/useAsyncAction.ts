import { useCallback, useRef, useState } from 'react';
import { App } from 'antd';

interface Options<R> {
  successMessage?: string;
  errorMessage?: string | ((err: unknown) => string);
  onSuccess?: (res: R) => void;
  onError?: (err: unknown) => void;
}

export interface UseAsyncActionResult<A extends unknown[], R> {
  run: (...args: A) => Promise<R | undefined>;
  loading: boolean;
  error: unknown;
}

export function useAsyncAction<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  options: Options<R> = {},
): UseAsyncActionResult<A, R> {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const optsRef = useRef(options);
  optsRef.current = options;

  const run = useCallback(
    async (...args: A): Promise<R | undefined> => {
      const opts = optsRef.current;
      setLoading(true);
      setError(null);
      try {
        const res = await fn(...args);
        if (opts.successMessage) void message.success(opts.successMessage);
        opts.onSuccess?.(res);
        return res;
      } catch (err) {
        setError(err);
        const resolved =
          typeof opts.errorMessage === 'function'
            ? opts.errorMessage(err)
            : (opts.errorMessage ?? (err instanceof Error ? err.message : 'Action failed'));
        void message.error(resolved);
        opts.onError?.(err);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [fn, message],
  );

  return { run, loading, error };
}
