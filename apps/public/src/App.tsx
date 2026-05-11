import { Routes, Route } from 'react-router-dom';
import NotFoundPage from '@code829/shared/components/shared/NotFoundPage';
import { AppShell, buildRoutes, type RouteConfig } from '@code829/shared/routing';
import { useSessionRefresh } from '@code829/shared/hooks/useSessionRefresh';
import PublicLayout from './components/layout/PublicLayout';

const routes: RouteConfig[] = [
  {
    layout: PublicLayout,
    children: [
      { index: true, loader: () => import('./pages/home/HomePage') },
      { path: 'events', loader: () => import('./pages/events/EventsPage') },
      { path: 'events/:slug', loader: () => import('./pages/event-detail/EventDetailPage') },
      { path: 'login', loader: () => import('./pages/login/LoginPage') },
      { path: 'signup', loader: () => import('./pages/signup/SignupPage') },
      { path: 'forgot-password', loader: () => import('./pages/forgot-password/ForgotPasswordPage') },
      { path: 'reset-password', loader: () => import('./pages/reset-password/ResetPasswordPage') },
      { path: 'verify-email', loader: () => import('./pages/verify-email/VerifyEmailPage') },
      { path: 'auth/verify', loader: () => import('./pages/auth/VerifyMagicLinkPage') },
      { path: 'onboarding', loader: () => import('./pages/auth/OnboardingPage') },
      { path: 'tickets/claim', loader: () => import('./pages/tickets/TicketClaimPage') },
      { path: 'feedback', loader: () => import('./pages/feedback/FeedbackPage') },

      {
        requiredRole: 'User',
        children: [
          { path: 'purchases', loader: () => import('./pages/purchases/MyPurchasesPage') },
          { path: 'purchases/:purchaseId', loader: () => import('./pages/purchases/PurchaseDetailPage') },
          { path: 'purchases/:purchaseId/tickets', loader: () => import('./pages/purchases/PurchaseTicketsPage') },
          { path: 'tickets', loader: () => import('./pages/tickets/MyTicketsPage') },
          { path: 'guest-tickets', loader: () => import('./pages/tickets/GuestTicketsPage') },
          { path: 'profile', loader: () => import('./pages/profile/ProfilePage') },
          { path: 'account/security', loader: () => import('./pages/account/SecurityPage') },
        ],
      },
    ],
  },
];

export default function App() {
  useSessionRefresh();
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
