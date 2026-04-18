import type { CSSProperties, ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import PageHeader from '../shared/PageHeader';

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

const PADDING: Record<NonNullable<Props['padding']>, CSSProperties> = {
  default: { padding: 0 },
  compact: { padding: 0 },
  none: { padding: 0 },
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
  const spacing = padding === 'compact' ? 16 : padding === 'none' ? 0 : 24;

  return (
    <div className={`spring-up${className ? ' ' + className : ''}`} style={PADDING[padding]}>
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
      {stats && <div style={{ marginBottom: spacing }}>{stats}</div>}
      {toolbar}
      {children}
    </div>
  );
}
