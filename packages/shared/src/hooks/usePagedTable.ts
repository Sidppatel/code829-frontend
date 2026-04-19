import { useState, useCallback, useEffect, useRef } from 'react';
import type { AxiosResponse } from 'axios';
import type { PagedResponse } from '../types/shared';

interface UsePagedTableOptions<T, P> {
  fetcher: (params: P) => Promise<AxiosResponse<PagedResponse<T>>>;
  defaultParams?: Partial<P>;
  defaultPageSize?: number;
}

interface UsePagedTableResult<T, P> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  onPageChange: (page: number, pageSize: number) => void;
  setFilters: (filters: Partial<P>) => void;
  filters: Partial<P>;
  refresh: () => void;
}

export function usePagedTable<T, P extends Record<string, unknown>>(
  options: UsePagedTableOptions<T, P>,
): UsePagedTableResult<T, P> {
  const { fetcher, defaultParams, defaultPageSize = 20 } = options;

  // Store fetcher in a ref so inline arrow functions don't cause fetchData to
  // be recreated on every render (which would trigger an infinite request loop).
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [filters, setFilters] = useState<Partial<P>>(defaultParams ?? {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...filters, page, pageSize } as unknown as P;
      const res = await fetcherRef.current(params);
      setData(res.data.items);
      setTotal(res.data.totalCount);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    void fetchData();
  }, [fetchData, refreshKey]);

  const handleSetFilters = useCallback((newFilters: Partial<P>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const onPageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  return {
    data,
    total,
    page,
    pageSize,
    loading,
    error,
    setPage,
    setPageSize,
    onPageChange,
    setFilters: handleSetFilters,
    filters,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
