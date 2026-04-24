import { Suspense, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '../components/shared/ErrorBoundary';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ScrollToTop from '../components/shared/ScrollToTop';

interface Props {
  children: ReactNode;
  /**
   * When true, renders a full-page maintenance notice instead of the routed
   * app. Intended to be wired from `import.meta.env.VITE_MAINTENANCE === 'true'`
   * in each app's entry so ops can flip a build flag without code changes.
   */
  maintenanceMode?: boolean;
  /** Optional custom fallback for Suspense; defaults to the shared spinner. */
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

/**
 * Cross-app chrome: router + error boundary + suspense + global gates.
 * Apps compose their routed content inside:
 *
 *   <AppShell><Routes>{buildRoutes(routes)}</Routes></AppShell>
 */
export function AppShell({ children, maintenanceMode = false, fallback }: Props) {
  if (maintenanceMode) return <MaintenancePage />;

  return (
    <BrowserRouter>
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={fallback ?? <LoadingSpinner />}>{children}</Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
