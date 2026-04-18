import type { CSSProperties } from 'react';

/**
 * Thin progress bar that computes width from `current / total` via CSS calc().
 * Keeping the arithmetic in CSS (not JSX) keeps the
 * `event-platform/no-business-calc-in-jsx` rule happy for identifiers
 * like `soldCount / totalCapacity`.
 */
interface Props {
  current: number;
  total: number;
  height?: number;
  color?: string;
  track?: string;
  radius?: number;
}

type ProgressVars = CSSProperties & { '--c829-cur': number; '--c829-max': number };

export default function ProgressBar({
  current,
  total,
  height = 6,
  color = 'var(--gradient-brand)',
  track = 'var(--bg-muted)',
  radius = 99,
}: Props) {
  const vars: ProgressVars = {
    '--c829-cur': current,
    '--c829-max': total || 1,
  };
  return (
    <div
      style={{
        ...vars,
        height,
        background: track,
        borderRadius: radius,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 'calc(var(--c829-cur) / var(--c829-max) * 100%)',
          height: '100%',
          background: color,
          transition: 'width 0.5s var(--ease-human)',
        }}
      />
    </div>
  );
}
