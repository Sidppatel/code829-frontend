import type { ReactNode } from 'react';
import { Alert } from 'antd';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';

interface EmptyOpts {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface Props<T> {
  loading: boolean;
  error?: string | null;
  data: T | null | undefined;
  skeleton?: 'hero' | 'card' | 'table' | 'list';
  empty?: EmptyOpts;
  children: (data: NonNullable<T>) => ReactNode;
}

function isEmpty<T>(data: T | null | undefined): boolean {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  return false;
}

export default function LoadingBoundary<T>({
  loading,
  error,
  data,
  skeleton,
  empty,
  children,
}: Props<T>) {
  if (loading && isEmpty(data)) {
    const mapped = skeleton === 'table' ? 'list' : skeleton;
    return <LoadingSpinner fullPage={false} skeleton={mapped} />;
  }
  if (error) {
    return <Alert type="error" message={error} style={{ margin: 24 }} />;
  }
  if (isEmpty(data)) {
    if (empty) return <EmptyState {...empty} />;
    return null;
  }
  return <>{children(data as NonNullable<T>)}</>;
}
