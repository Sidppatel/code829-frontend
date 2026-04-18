import type { CSSProperties, ReactNode } from 'react';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<Size, string> = {
  xs: '16px',
  sm: '20px',
  md: 'clamp(1.4rem, 3vw, 1.9rem)',
  lg: 'clamp(1.8rem, 4vw, 2.4rem)',
  xl: 'clamp(2.2rem, 5vw, 3.2rem)',
};

interface Props {
  size?: Size;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'div';
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  color?: string;
}

export default function DisplayHeading({
  size = 'lg',
  as: Tag = 'h2',
  children,
  style,
  className,
  color = 'var(--text-primary)',
}: Props) {
  return (
    <Tag
      className={className}
      style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: SIZE_MAP[size],
        fontWeight: 700,
        color,
        letterSpacing: '-0.025em',
        lineHeight: 1.1,
        margin: 0,
        textWrap: 'balance',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
