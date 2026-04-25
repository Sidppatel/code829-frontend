import { Routes, Route } from 'react-router-dom';
import NotFoundPage from '@code829/shared/components/shared/NotFoundPage';
import { AppShell, buildRoutes, type RouteConfig } from '@code829/shared/routing';
import { useSessionRefresh } from '@code829/shared/hooks/useSessionRefresh';
import AdminLayout from './components/layout/AdminLayout';

const routes: RouteConfig[] = [
  { path: 'login', loader: () => import('./pages/login/AdminLoginPage') },
  { path: 'signup', loader: () => import('./pages/signup/AdminSignupPage') },
  { path: 'forgot-password', loader: () => import('./pages/forgot-password/ForgotPasswordPage') },
  { path: 'reset-password', loader: () => import('./pages/reset-password/ResetPasswordPage') },
  {
    requiredRole: 'Admin',
    layout: AdminLayout,
    children: [
      { index: true, loader: () => import('./pages/dashboard/AdminDashboardPage') },
      { path: 'events', loader: () => import('./pages/events/EventsListPage') },
      { path: 'events/new', loader: () => import('./pages/events/EventWizardPage') },
      { path: 'events/:id/edit', loader: () => import('./pages/events/EventWizardPage') },
      { path: 'events/:id', loader: () => import('./pages/events/EventManagePage') },
      { path: 'venues', loader: () => import('./pages/venues/VenuesPage') },
      { path: 'venues/new', loader: () => import('./pages/venues/VenueFormPage') },
      { path: 'venues/:id', loader: () => import('./pages/venues/VenueFormPage') },
      { path: 'purchases', loader: () => import('./pages/purchases/AdminPurchasesPage') },
      { path: 'table-types', loader: () => import('./pages/table-types/TableTypesPage') },
      { path: 'layout/:eventId', loader: () => import('./pages/layout-editor/LayoutEditorPage') },
      { path: 'analytics', loader: () => import('./pages/analytics/AnalyticsPage') },
      { path: 'checkin/select', loader: () => import('./pages/checkin/CheckInSelectPage') },
      { path: 'checkin/:eventId', loader: () => import('./pages/checkin/CheckInPage') },
      { path: 'staff', loader: () => import('./pages/staff/StaffManagementPage') },
      { path: 'admins', loader: () => import('./pages/admins/AdminsPage') },
      { path: 'invitations', loader: () => import('./pages/invitations/InvitationsPage') },
      { path: 'settings', loader: () => import('./pages/settings/SettingsPage') },
      { path: 'settings/stripe/return', loader: () => import('./pages/settings/SettingsPage') },
      { path: 'settings/stripe/refresh', loader: () => import('./pages/settings/StripeRefreshPage') },
      { path: 'feedback', loader: () => import('./pages/feedback/FeedbackPage') },
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
