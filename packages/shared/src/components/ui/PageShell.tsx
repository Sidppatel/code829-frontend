import type { ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import PageHeader from '../shared/PageHeader';
import { useIsMobile } from '../../hooks/useIsMobile';

interface Props {
  title?: string;
  subtitle?: string | string[];
  rotateSubtitle?: boolean;
  extra?: ReactNode;
  onBack?: () => void;
  documentTitle?: string;
  preamble?: ReactNode;
  toolbar?: ReactNode;
  stats?: ReactNode;
  children: ReactNode;
  padding?: 'default' | 'compact' | 'none';
  className?: string;
  loading?: boolean;
}

const getPaddingSpacing = (padding: NonNullable<Props['padding']>): number => {
  switch (padding) {
    case 'default': return 24;
    case 'compact': return 16;
    case 'none': return 0;
    default: return 24;
  }
};

export default function PageShell({
  title,
  subtitle,
  rotateSubtitle,
  extra,
  onBack,
  documentTitle,
  preamble,
  toolbar,
  stats,
  children,
  padding = 'default',
  className,
  loading,
}: Props) {
  const isMobile = useIsMobile();
  const spacing = getPaddingSpacing(padding);
  const horizontalPadding = isMobile ? (padding === 'none' ? 0 : 20) : spacing;

  return (
    <div className={`spring-up${className ? ' ' + className : ''}`}>
      {documentTitle && (
        <Helmet>
          <title>{documentTitle}</title>
        </Helmet>
      )}
      {preamble}
      {title && (
        <PageHeader
          title={title}
          subtitle={subtitle}
          extra={extra}
          onBack={onBack}
          rotateSubtitle={rotateSubtitle}
        />
      )}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <div className="pulse-soft" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)' }} />
        </div>
      ) : (
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            paddingLeft: horizontalPadding,
            paddingRight: horizontalPadding,
            paddingBottom: 80,
          }}
        >
          {stats && <div style={{ marginBottom: spacing }}>{stats}</div>}
          {toolbar}
          {children}
        </div>
      )}
    </div>
  );
}
