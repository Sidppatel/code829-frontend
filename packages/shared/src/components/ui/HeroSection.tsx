import type { ReactNode } from 'react';
import { Button } from 'antd';

interface Props {
  backgroundImage: string;
  kicker?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  ctaLabel?: string;
  onCta?: () => void;
  height?: string;
  alignment?: 'left' | 'center';
  overlay?: 'gradient' | 'duotone' | 'none';
}

const OVERLAY: Record<NonNullable<Props['overlay']>, string> = {
  gradient: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.8) 100%)',
  duotone: 'linear-gradient(135deg, rgba(124, 58, 237, 0.55), rgba(14, 14, 20, 0.75))',
  none: 'rgba(0,0,0,0.35)',
};

export default function HeroSection({
  backgroundImage,
  kicker,
  title,
  subtitle,
  ctaLabel,
  onCta,
  height = '90vh',
  alignment = 'left',
  overlay = 'gradient',
}: Props) {
  return (
    <section
      className="c829-hero"
      style={{
        position: 'relative',
        height,
        minHeight: 420,
        width: '100%',
        overflow: 'hidden',
        color: 'var(--text-on-brand)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: alignment === 'center' ? 'center' : 'flex-start',
      }}
    >
      <div
        className="c829-kenburns"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: OVERLAY[overlay] }} />
      <div
        style={{
          position: 'relative',
          padding: '0 8vw 12vh',
          maxWidth: 820,
          textAlign: alignment,
        }}
      >
        {kicker && (
          <div
            style={{
              textTransform: 'uppercase',
              letterSpacing: 2.5,
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-on-brand)',
              opacity: 0.85,
              marginBottom: 16,
            }}
          >
            {kicker}
          </div>
        )}
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 700,
            lineHeight: 1.05,
            margin: 0,
            letterSpacing: '-0.02em',
            color: 'var(--text-on-brand)',
            textWrap: 'balance',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: 'clamp(14px, 1.4vw, 18px)',
              opacity: 0.9,
              marginTop: 20,
              maxWidth: 620,
              lineHeight: 1.5,
              fontWeight: 500,
              color: 'var(--text-on-brand)',
            }}
          >
            {subtitle}
          </p>
        )}
        {ctaLabel && onCta && (
          <Button
            type="primary"
            size="large"
            onClick={onCta}
            style={{
              marginTop: 28,
              height: 52,
              padding: '0 36px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 600,
              boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
            }}
          >
            {ctaLabel}
          </Button>
        )}
      </div>
    </section>
  );
}
