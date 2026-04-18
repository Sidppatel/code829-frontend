import React from 'react';
import { Link } from 'react-router-dom';
import logoUrl from '../../assets/logo.svg';

// Centralized brand name — change here to update everywhere
export const BRAND_NAME = 'Code829';
export const BRAND_TAGLINE = '';
export { logoUrl as BRAND_LOGO_URL };

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  collapsed?: boolean;
  className?: string;
  style?: React.CSSProperties;
  textColor?: string;
}

export default function BrandLogo({
  size = 'md',
  showText = true,
  collapsed = false,
  className,
  style,
  textColor = 'var(--text-primary)',
}: BrandLogoProps) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const iconSize = isLg ? 48 : isSm ? 32 : 38;
  const textFontSize = isLg ? 22 : isSm ? 16 : 18;

  return (
    <Link
      to="/"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isLg ? 12 : 8,
        textDecoration: 'none',
        ...style,
      }}
    >
      <div style={{
        width: iconSize,
        height: iconSize,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <img
          src={logoUrl}
          alt={BRAND_NAME}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {showText && !collapsed && (
        <span style={{
          fontSize: textFontSize,
          fontWeight: 700,
          color: textColor,
          letterSpacing: '-0.5px',
          fontFamily: "'Playfair Display', serif",
        }}>
          {BRAND_NAME}
        </span>
      )}
    </Link>
  );
}
