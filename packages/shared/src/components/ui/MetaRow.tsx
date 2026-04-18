import type { CSSProperties, ReactNode } from 'react';

export interface MetaItem {
  icon: ReactNode;
  label: ReactNode;
  key?: string;
}

interface Props {
  items: MetaItem[];
  size?: 'sm' | 'md';
  gap?: number;
  style?: CSSProperties;
}

export default function MetaRow({ items, size = 'sm', gap = 14, style }: Props) {
  const fontSize = size === 'sm' ? 12 : 13;
  return (
    <div
      style={{
        display: 'flex',
        gap,
        flexWrap: 'wrap',
        color: 'var(--text-muted)',
        fontSize,
        ...style,
      }}
    >
      {items.map((item, i) => (
        <span
          key={item.key ?? i}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          {item.icon}
          {item.label}
        </span>
      ))}
    </div>
  );
}
