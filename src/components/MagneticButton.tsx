import React, { useRef, useState, useCallback } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  'aria-label'?: string;
}

export default function MagneticButton({
  children,
  onClick,
  className = '',
  style,
  type = 'button',
  disabled = false,
  'aria-label': ariaLabel,
}: MagneticButtonProps): React.ReactElement {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleCounter = useRef(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>): void => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.28;
    const dy = (e.clientY - cy) * 0.28;
    setTranslate({ x: dx, y: dy });
  }, []);

  const handleMouseEnter = useCallback((): void => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback((): void => {
    setTranslate({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>): void => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = ++rippleCounter.current;
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
    onClick?.();
  }, [onClick]);

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transform: `translate(${translate.x}px, ${translate.y}px)`,
        transition: isHovered
          ? 'transform 0.15s ease'
          : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        background: 'var(--accent-cta)',
        color: 'var(--bg-primary)',
        border: 'none',
        borderRadius: '0.75rem',
        padding: '0.85rem 2rem',
        fontFamily: 'var(--font-body)',
        fontSize: '1rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        outline: 'none',
        boxShadow: isHovered
          ? '0 0 0 4px color-mix(in srgb, var(--accent-cta) 30%, transparent), 0 8px 24px color-mix(in srgb, var(--accent-cta) 40%, transparent)'
          : '0 4px 14px color-mix(in srgb, var(--accent-cta) 30%, transparent)',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {/* Glow pulse overlay */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background:
            'radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--bg-secondary) 25%, transparent), transparent 70%)',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Ripples */}
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: r.x,
            top: r.y,
            width: 8,
            height: 8,
            marginLeft: -4,
            marginTop: -4,
            borderRadius: '50%',
            background: 'color-mix(in srgb, var(--bg-secondary) 50%, transparent)',
            transform: 'scale(0)',
            animation: 'ripple-expand 0.6s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      ))}

      <style>{`
        @keyframes ripple-expand {
          to { transform: scale(20); opacity: 0; }
        }
      `}</style>

      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </button>
  );
}
