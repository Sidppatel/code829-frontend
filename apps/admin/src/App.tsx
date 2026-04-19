import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NotFoundPage from '@code829/shared/components/shared/NotFoundPage';
import ErrorBoundary from '@code829/shared/components/shared/ErrorBoundary';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import ProtectedRoute from '@code829/shared/components/auth/ProtectedRoute';
import ScrollToTop from '@code829/shared/components/shared/ScrollToTop';
import { useSessionRefresh } from '@code829/shared/hooks/useSessionRefresh';
import AdminLayout from './components/layout/AdminLayout';

const AdminLoginPage = lazy(() => import('./pages/login/AdminLoginPage'));
const AdminSignupPage = lazy(() => import('./pages/signup/AdminSignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/reset-password/ResetPasswordPage'));
const AdminDashboardPage = lazy(() => import('./pages/dashboard/AdminDashboardPage'));
const AdminEventsListPage = lazy(() => import('./pages/events/EventsListPage'));
const EventWizardPage = lazy(() => import('./pages/events/EventWizardPage'));
const EventManagePage = lazy(() => import('./pages/events/EventManagePage'));
const VenuesPage = lazy(() => import('./pages/venues/VenuesPage'));
const VenueFormPage = lazy(() => import('./pages/venues/VenueFormPage'));
const AdminPurchasesPage = lazy(() => import('./pages/purchases/AdminPurchasesPage'));
const TableTypesPage = lazy(() => import('./pages/table-types/TableTypesPage'));
const LayoutEditorPage = lazy(() => import('./pages/layout-editor/LayoutEditorPage'));
const CheckInSelectPage = lazy(() => import('./pages/checkin/CheckInSelectPage'));
const CheckInPage = lazy(() => import('./pages/checkin/CheckInPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage'));
const StaffManagementPage = lazy(() => import('./pages/staff/StaffManagementPage'));
const InvitationsPage = lazy(() => import('./pages/invitations/InvitationsPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));

export default function App() {
  useSessionRefresh('/admin/auth/me');

  return (
    <BrowserRouter>
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="login" element={<AdminLoginPage />} />
            <Route path="signup" element={<AdminSignupPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route element={<ProtectedRoute minRole="Admin"><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="events" element={<AdminEventsListPage />} />
              <Route path="events/new" element={<EventWizardPage />} />
              <Route path="events/:id/edit" element={<EventWizardPage />} />
              <Route path="events/:id" element={<EventManagePage />} />
              <Route path="venues" element={<VenuesPage />} />
              <Route path="venues/new" element={<VenueFormPage />} />
              <Route path="venues/:id" element={<VenueFormPage />} />
              <Route path="purchases" element={<AdminPurchasesPage />} />
              <Route path="table-types" element={<TableTypesPage />} />
              <Route path="layout/:eventId" element={<LayoutEditorPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="checkin/select" element={<CheckInSelectPage />} />
              <Route path="checkin/:eventId" element={<CheckInPage />} />
              <Route path="staff" element={<StaffManagementPage />} />
              <Route path="invitations" element={<InvitationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
