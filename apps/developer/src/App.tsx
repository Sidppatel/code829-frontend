import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NotFoundPage from '@code829/shared/components/shared/NotFoundPage';
import ErrorBoundary from '@code829/shared/components/shared/ErrorBoundary';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import ProtectedRoute from '@code829/shared/components/auth/ProtectedRoute';
import { useSessionRefresh } from '@code829/shared/hooks/useSessionRefresh';
import DeveloperLayout from './components/layout/DeveloperLayout';

const DevLoginPage = lazy(() => import('./pages/login/DevLoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/reset-password/ResetPasswordPage'));
const DevLogsPage = lazy(() => import('./pages/logs/DevLogsPage'));
const EmailLogsPage = lazy(() => import('./pages/email-logs/EmailLogsPage'));
const SystemLogsPage = lazy(() => import('./pages/system-logs/SystemLogsPage'));
const DevSettingsPage = lazy(() => import('./pages/settings/DevSettingsPage'));
const DevUsersPage = lazy(() => import('./pages/users/DevUsersPage'));
const DevEventsPage = lazy(() => import('./pages/events/DevEventsPage'));
const AdminManagementPage = lazy(() => import('./pages/admins/AdminManagementPage'));
const StaffManagementPage = lazy(() => import('./pages/staff/StaffManagementPage'));
const DevInvitationsPage = lazy(() => import('./pages/invitations/DevInvitationsPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));

export default function App() {
  useSessionRefresh('/admin/auth/me');

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="login" element={<DevLoginPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route element={<ProtectedRoute minRole="Developer"><DeveloperLayout /></ProtectedRoute>}>
              <Route index element={<DevLogsPage />} />
              <Route path="email-logs" element={<EmailLogsPage />} />
              <Route path="system-logs" element={<SystemLogsPage />} />
              <Route path="admins" element={<AdminManagementPage />} />
              <Route path="staff" element={<StaffManagementPage />} />
              <Route path="invitations" element={<DevInvitationsPage />} />
              <Route path="users" element={<DevUsersPage />} />
              <Route path="events" element={<DevEventsPage />} />
              <Route path="settings" element={<DevSettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
