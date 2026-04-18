import type { ReactNode } from 'react';

interface Props {
  kicker?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  rightSlot?: ReactNode;
}

export default function PagePreamble({ kicker, title, subtitle, rightSlot }: Props) {
  return (
    <section
      style={{
        position: 'relative',
        padding: '120px 32px 40px',
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
          {kicker && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--primary-light)',
                letterSpacing: 2.5,
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              {kicker}
            </div>
          )}
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              margin: 0,
              lineHeight: 1.1,
              textWrap: 'balance',
            }}
          >
            {title}
          </h1>
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
