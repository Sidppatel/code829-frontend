import type { ReactNode } from 'react';

export type StatusKind =
  | 'draft'
  | 'published'
  | 'live'
  | 'soldout'
  | 'cancelled'
  | 'completed'
  | 'neutral';

interface Props {
  kind?: StatusKind;
  children: ReactNode;
}

export default function StatusBadge({ kind = 'neutral', children }: Props) {
  const cls = kind === 'neutral' ? 'status-draft' : `status-${kind}`;
  return (
    <span className={`status-pill ${cls}`}>
      <span className="status-pill-dot" />
      {children}
    </span>
  );
}
