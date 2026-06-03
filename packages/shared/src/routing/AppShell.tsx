import { Suspense, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '../components/shared/ErrorBoundary';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ScrollToTop from '../components/shared/ScrollToTop';
import { PageViewTracker } from './PageViewTracker';

interface Props {
  children: ReactNode;
  maintenanceMode?: boolean;
  fallback?: ReactNode;
}

function MaintenancePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--text-primary)',
        background: 'var(--bg-page)',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>We&rsquo;ll be right back</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: 420 }}>
        The platform is undergoing scheduled maintenance. Please check back in a few minutes.
      </p>
    </div>
  );
}

export function AppShell({ children, maintenanceMode = false, fallback }: Props) {
  if (maintenanceMode) return <MaintenancePage />;

  return (
    <BrowserRouter>
      <ScrollToTop />
      <PageViewTracker />
      <ErrorBoundary>
        <Suspense fallback={fallback ?? <LoadingSpinner />}>{children}</Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
