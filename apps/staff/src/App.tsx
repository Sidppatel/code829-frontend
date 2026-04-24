import { Routes, Route, Navigate } from 'react-router-dom';
import NotFoundPage from '@code829/shared/components/shared/NotFoundPage';
import { AppShell, buildRoutes, type RouteConfig } from '@code829/shared/routing';
import { useSessionRefresh } from '@code829/shared/hooks/useSessionRefresh';
import StaffLayout from './components/layout/StaffLayout';

const routes: RouteConfig[] = [
  { path: 'login', loader: () => import('./pages/login/StaffLoginPage') },
  { path: 'signup', loader: () => import('./pages/signup/StaffSignupPage') },
  { path: 'forgot-password', loader: () => import('./pages/forgot-password/ForgotPasswordPage') },
  { path: 'reset-password', loader: () => import('./pages/reset-password/ResetPasswordPage') },
  {
    requiredRole: 'Staff',
    layout: StaffLayout,
    children: [
      { index: true, element: <Navigate to="checkin/select" replace /> },
      { path: 'checkin/select', loader: () => import('./pages/checkin/CheckInSelectPage') },
      { path: 'checkin/:eventId', loader: () => import('./pages/checkin/CheckInPage') },
      { path: 'profile', loader: () => import('./pages/profile/ProfilePage') },
      { path: 'settings', loader: () => import('./pages/settings/SettingsPage') },
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
