import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import RoleGuard from './components/RoleGuard';
import { useAuthStore } from './stores/authStore';

const OnboardingScreen = React.lazy(() => import('./components/OnboardingScreen'));

const HomePage = React.lazy(() => import('./pages/HomePage'));
const EventsPage = React.lazy(() => import('./pages/EventsPage'));
const EventDetailPage = React.lazy(() => import('./pages/EventDetailPage'));
const MyBookingsPage = React.lazy(() => import('./pages/MyBookingsPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const InvitationPage = React.lazy(() => import('./pages/InvitationPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));

const AdminLayout = React.lazy(() => import('./layouts/AdminLayout'));
const AdminDashboardPage = React.lazy(() => import('./pages/admin/AdminDashboardPage'));
const VenuesPage = React.lazy(() => import('./pages/admin/VenuesPage'));
const VenueFormPage = React.lazy(() => import('./pages/admin/VenueFormPage'));
const EventsListPage = React.lazy(() => import('./pages/admin/EventsListPage'));
const EventWizardPage = React.lazy(() => import('./pages/admin/EventWizardPage'));
const EventManagePage = React.lazy(() => import('./pages/admin/EventManagePage'));
const AnalyticsPage = React.lazy(() => import('./pages/admin/AnalyticsPage'));
const TableTypesPage = React.lazy(() => import('./pages/admin/TableTypesPage'));

const DeveloperLayout = React.lazy(() => import('./layouts/DeveloperLayout'));
const DeveloperDashboardPage = React.lazy(() => import('./pages/developer/DeveloperDashboardPage'));
const DeveloperEventsPage = React.lazy(() => import('./pages/developer/DeveloperEventsPage'));
const DeveloperAnalyticsPage = React.lazy(() => import('./pages/developer/AnalyticsPage'));
const DeveloperSettingsPage = React.lazy(() => import('./pages/developer/DeveloperSettingsPage'));

function PageLoader(): React.ReactElement {
  return (
    <div
      role="status"
      aria-label="Loading page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent-primary)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        Loading…
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AppRoutes(): React.ReactElement {
  const { user, isAuthenticated } = useAuthStore();
  return (
    <>
      {isAuthenticated && user && !user.hasCompletedOnboarding && (
        <Suspense fallback={<PageLoader />}>
          <OnboardingScreen />
        </Suspense>
      )}      {/* Noise grain overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      <Navbar />

      <main id="main-content">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/me/bookings" element={<MyBookingsPage />} />
          <Route path="/me/profile" element={<ProfilePage />} />
          <Route path="/invitation/:token" element={<InvitationPage />} />
          <Route path="/auth/login" element={<LoginPage />} />

          {/* Admin routes — Admin & Staff only, Developers redirected to /developer */}
          <Route path="/admin" element={
            <RoleGuard allowed={['Admin', 'Staff']} redirectTo="/developer">
              <AdminLayout />
            </RoleGuard>
          }>
            <Route index element={<AdminDashboardPage />} />
            <Route path="venues" element={<VenuesPage />} />
            <Route path="venues/new" element={<VenueFormPage />} />
            <Route path="venues/:id/edit" element={<VenueFormPage />} />
            <Route path="events" element={<EventsListPage />} />
            <Route path="events/new" element={<EventWizardPage />} />
            <Route path="events/:id" element={<EventManagePage />} />
            <Route path="events/:id/edit" element={<EventWizardPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="table-types" element={<TableTypesPage />} />
          </Route>

          {/* Developer routes — Developer only, Admins redirected to /admin */}
          <Route path="/developer" element={
            <RoleGuard allowed={['Developer']} redirectTo="/admin">
              <DeveloperLayout />
            </RoleGuard>
          }>
            <Route index element={<DeveloperDashboardPage />} />
            <Route path="events" element={<DeveloperEventsPage />} />
            <Route path="analytics" element={<DeveloperAnalyticsPage />} />
            <Route path="settings" element={<DeveloperSettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            fontFamily: 'var(--font-body)',
          },
          ariaProps: {
            role: 'status',
            'aria-live': 'polite',
          },
        }}
      />
    </>
  );
}

export default function App(): React.ReactElement {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </HelmetProvider>
  );
}
