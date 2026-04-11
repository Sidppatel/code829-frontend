import React from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';

interface Props {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
  onBack?: () => void;
}

export default function PageHeader({ title, subtitle, extra, onBack }: Props) {
  return (
    <div style={{
      marginBottom: 32,
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
        {onBack && (
          <div
            onClick={onBack}
            className="hover-lift"
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <ArrowLeftOutlined style={{ fontSize: 16 }} />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: 'var(--h2-size, 32px)', 
            fontWeight: 700, 
            color: 'var(--text-primary)',
            fontFamily: "'Playfair Display', serif",
            letterSpacing: '-0.02em'
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ 
              margin: '4px 0 0 0', 
              fontSize: 14, 
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {extra && <div style={{ flexShrink: 0 }} className="spring-up">{extra}</div>}
    </div>
  );
}
