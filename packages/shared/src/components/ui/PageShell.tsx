import type { CSSProperties, ReactNode } from 'react';
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
}

const PADDING_VARS: Record<NonNullable<Props['padding']>, number> = {
  default: 24,
  compact: 16,
  none: 0,
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
}: Props) {
  const isMobile = useIsMobile();
  const spacing = PADDING_VARS[padding];
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
    </div>
  );
}
