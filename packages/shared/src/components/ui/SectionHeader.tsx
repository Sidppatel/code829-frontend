import type { CSSProperties, ReactNode } from 'react';
import DisplayHeading from './DisplayHeading';

interface Props {
  title: ReactNode;
  action?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  style?: CSSProperties;
}

export default function SectionHeader({ title, action, size = 'lg', style }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 12,
        flexWrap: 'wrap',
        marginBottom: 24,
        ...style,
      }}
    >
      <DisplayHeading size={size}>{title}</DisplayHeading>
      {action && <div>{action}</div>}
    </div>
  );
}
