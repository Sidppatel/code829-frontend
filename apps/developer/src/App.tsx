import { Routes, Route } from 'react-router-dom';
import NotFoundPage from '@code829/shared/components/shared/NotFoundPage';
import { AppShell, buildRoutes, type RouteConfig } from '@code829/shared/routing';
import { useSessionRefresh } from '@code829/shared/hooks/useSessionRefresh';
import DeveloperLayout from './components/layout/DeveloperLayout';

const routes: RouteConfig[] = [
  { path: 'login', loader: () => import('./pages/login/DevLoginPage') },
  { path: 'forgot-password', loader: () => import('./pages/forgot-password/ForgotPasswordPage') },
  { path: 'reset-password', loader: () => import('./pages/reset-password/ResetPasswordPage') },
  {
    requiredRole: 'Developer',
    layout: DeveloperLayout,
    children: [
      { index: true, loader: () => import('./pages/logs/DevLogsPage') },
      { path: 'visitors', loader: () => import('./pages/visitors/VisitorLogsPage') },
      { path: 'email-logs', loader: () => import('./pages/email-logs/EmailLogsPage') },
      { path: 'system-logs', loader: () => import('./pages/system-logs/SystemLogsPage') },
      { path: 'admins', loader: () => import('./pages/admins/AdminManagementPage') },
      { path: 'staff', loader: () => import('./pages/staff/StaffManagementPage') },
      { path: 'invitations', loader: () => import('./pages/invitations/DevInvitationsPage') },
      { path: 'users', loader: () => import('./pages/users/DevUsersPage') },
      { path: 'events', loader: () => import('./pages/events/DevEventsPage') },
      { path: 'organizations', loader: () => import('./pages/organizations/OrganizationsPage') },
      { path: 'settings', loader: () => import('./pages/settings/DevSettingsPage') },
      { path: 'profile', loader: () => import('./pages/profile/ProfilePage') },
    ],
  },
];

export default function App() {
  useSessionRefresh('/admin/auth/me');
  const maintenance = import.meta.env.VITE_MAINTENANCE === 'true';

  return (
    <AppShell maintenanceMode={maintenance}>
      <Routes>
        {buildRoutes(routes)}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
