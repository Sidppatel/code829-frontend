import type { ReactNode } from 'react';
import Kicker from '../ui/Kicker';
import DisplayHeading from '../ui/DisplayHeading';
import { useIsMobile } from '../../hooks/useIsMobile';

interface Props {
  kicker?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  rightSlot?: ReactNode;
}

export default function PagePreamble({ kicker, title, subtitle, rightSlot }: Props) {
  const isMobile = useIsMobile();
  const px = isMobile ? 20 : 32;

  return (
    <section
      style={{
        position: 'relative',
        padding: `120px ${px}px 40px`,
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background:
            'linear-gradient(180deg, var(--primary-soft) 0%, transparent 72%), radial-gradient(ellipse at 85% 0%, var(--primary-muted), transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {kicker && <Kicker style={{ marginBottom: 14 }}>{kicker}</Kicker>}
          <DisplayHeading as="h1" size="xl">
            {title}
          </DisplayHeading>
          {subtitle && (
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 15,
                margin: '14px 0 0',
                maxWidth: 640,
                lineHeight: 1.55,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {rightSlot && <div style={{ flexShrink: 0 }}>{rightSlot}</div>}
      </div>
    </section>
  );
}
