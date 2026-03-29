import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';

const HomePage = React.lazy(() => import('./pages/HomePage'));
const EventsPage = React.lazy(() => import('./pages/EventsPage'));
const EventDetailPage = React.lazy(() => import('./pages/EventDetailPage'));
const MyBookingsPage = React.lazy(() => import('./pages/MyBookingsPage'));
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

function PageLoader(): React.ReactElement {
  return (
    <div
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AppRoutes(): React.ReactElement {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      {/* Noise grain overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Public navbar hidden on admin pages (AdminLayout has its own nav) */}
      {!isAdmin && <Navbar />}

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/me/bookings" element={<MyBookingsPage />} />
          <Route path="/auth/login" element={<LoginPage />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout />}>
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

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
