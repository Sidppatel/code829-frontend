import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  collapsed?: boolean;
  className?: string;
  style?: React.CSSProperties;
  logoUrl?: string; // Future use for image logo
}

export default function BrandLogo({
  size = 'md',
  showText = true,
  collapsed = false,
  className,
  style,
  logoUrl = '/logo.jpg'
}: BrandLogoProps) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';
  
  const iconSize = isLg ? 40 : isSm ? 28 : 32;
  const fontSize = isLg ? 22 : isSm ? 16 : 18;
  const textFontSize = isLg ? 24 : isSm ? 20 : 20;
  const letterSpacing = isLg ? '-1px' : '-0.5px';

  return (
    <Link 
      to="/" 
      className={className}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: isLg ? 12 : 8, 
        textDecoration: 'none',
        ...style 
      }}
    >
      <div style={{
        background: logoUrl ? 'transparent' : 'linear-gradient(135deg, var(--accent-violet), var(--accent-rose))',
        width: iconSize,
        height: iconSize,
        borderRadius: isLg ? 12 : 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: logoUrl ? 'none' : (isLg ? '0 8px 16px rgba(99, 102, 241, 0.3)' : '0 4px 12px rgba(99, 102, 241, 0.2)'),
        flexShrink: 0,
        overflow: 'hidden'
      }}>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <span style={{ color: '#fff', fontSize: fontSize, fontWeight: 800 }}>C</span>
        )}
      </div>
      
      {showText && !collapsed && (
        <span style={{ 
          fontSize: textFontSize, 
          fontWeight: 800, 
          color: 'var(--text-primary)', 
          letterSpacing: letterSpacing,
          display: 'flex',
          alignItems: 'center',
          fontFamily: isLg ? "'Inter', sans-serif" : "'Playfair Display', serif"
        }}>
          Code<span style={{ color: 'var(--accent-rose)', fontWeight: 400 }}>829</span>
        </span>
      )}
    </Link>
  );
}
