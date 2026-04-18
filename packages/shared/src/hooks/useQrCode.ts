import { useCallback, useEffect, useState } from 'react';

export type QrFetcher = () => Promise<Blob>;

export interface UseQrCodeResult {
  url: string | null;
  loading: boolean;
  error: string | null;
  isOpen: boolean;
  show: (fetcher: QrFetcher) => Promise<void>;
  hide: () => void;
}

export function useQrCode(): UseQrCodeResult {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  const show = useCallback(async (fetcher: QrFetcher) => {
    setIsOpen(true);
    setLoading(true);
    setError(null);
    setUrl(null);
    try {
      const blob = await fetcher();
      setUrl(URL.createObjectURL(blob));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load QR');
    } finally {
      setLoading(false);
    }
  }, []);

  const hide = useCallback(() => {
    setIsOpen(false);
    setUrl(null);
  }, []);

  return { url, loading, error, isOpen, show, hide };
}
