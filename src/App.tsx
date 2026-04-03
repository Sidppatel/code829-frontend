import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/shared/ErrorBoundary';
import LoadingSpinner from './components/shared/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import DeveloperLayout from './components/layout/DeveloperLayout';

const HomePage = lazy(() => import('./pages/home/HomePage'));
const EventsPage = lazy(() => import('./pages/events/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/event-detail/EventDetailPage'));
const LoginPage = lazy(() => import('./pages/login/LoginPage'));
const MyBookingsPage = lazy(() => import('./pages/bookings/MyBookingsPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));

const AdminDashboardPage = lazy(() => import('./pages/admin/dashboard/AdminDashboardPage'));
const AdminEventsListPage = lazy(() => import('./pages/admin/events/EventsListPage'));
const EventWizardPage = lazy(() => import('./pages/admin/events/EventWizardPage'));
const EventManagePage = lazy(() => import('./pages/admin/events/EventManagePage'));
const VenuesPage = lazy(() => import('./pages/admin/venues/VenuesPage'));
const VenueFormPage = lazy(() => import('./pages/admin/venues/VenueFormPage'));
const AdminBookingsPage = lazy(() => import('./pages/admin/bookings/AdminBookingsPage'));
const TableTypesPage = lazy(() => import('./pages/admin/table-types/TableTypesPage'));
const LayoutEditorPage = lazy(() => import('./pages/admin/layout-editor/LayoutEditorPage'));
const CheckInPage = lazy(() => import('./pages/admin/checkin/CheckInPage'));
const CheckInSelectPage = lazy(() => import('./pages/admin/checkin/CheckInSelectPage'));
const SettingsPage = lazy(() => import('./pages/admin/settings/SettingsPage'));
const AnalyticsPage = lazy(() => import('./pages/admin/analytics/AnalyticsPage'));

const DevLogsPage = lazy(() => import('./pages/developer/logs/DevLogsPage'));
const EmailLogsPage = lazy(() => import('./pages/developer/email-logs/EmailLogsPage'));
const SystemLogsPage = lazy(() => import('./pages/developer/system-logs/SystemLogsPage'));
const DevSettingsPage = lazy(() => import('./pages/developer/settings/DevSettingsPage'));
const DevUsersPage = lazy(() => import('./pages/developer/users/DevUsersPage'));

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public */}
            <Route element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="events/:slug" element={<EventDetailPage />} />
              <Route path="login" element={<LoginPage />} />
            </Route>

            {/* Authenticated Users */}
            <Route element={<ProtectedRoute><PublicLayout /></ProtectedRoute>}>
              <Route path="bookings" element={<MyBookingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Admin */}
            <Route
              path="/admin"
              element={<ProtectedRoute minRole="Admin"><AdminLayout /></ProtectedRoute>}
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="events" element={<AdminEventsListPage />} />
              <Route path="events/new" element={<EventWizardPage />} />
              <Route path="events/:id/edit" element={<EventWizardPage />} />
              <Route path="events/:id" element={<EventManagePage />} />
              <Route path="venues" element={<VenuesPage />} />
              <Route path="venues/new" element={<VenueFormPage />} />
              <Route path="venues/:id" element={<VenueFormPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="table-types" element={<TableTypesPage />} />
              <Route path="layout/:eventId" element={<LayoutEditorPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
            </Route>

            {/* Staff (Check-In) — accessible by Staff, Admin, Developer */}
            <Route
              path="/staff"
              element={<ProtectedRoute minRole="Staff"><AdminLayout /></ProtectedRoute>}
            >
              <Route path="checkin/select" element={<CheckInSelectPage />} />
              <Route path="checkin/:eventId" element={<CheckInPage />} />
            </Route>

            {/* Developer */}
            <Route
              path="/developer"
              element={<ProtectedRoute minRole="Developer"><DeveloperLayout /></ProtectedRoute>}
            >
              <Route index element={<DevLogsPage />} />
              <Route path="email-logs" element={<EmailLogsPage />} />
              <Route path="system-logs" element={<SystemLogsPage />} />
              <Route path="settings" element={<DevSettingsPage />} />
              <Route path="users" element={<DevUsersPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
