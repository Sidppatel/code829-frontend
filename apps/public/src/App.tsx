import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NotFoundPage from '@code829/shared/components/shared/NotFoundPage';
import ErrorBoundary from '@code829/shared/components/shared/ErrorBoundary';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import ProtectedRoute from '@code829/shared/components/auth/ProtectedRoute';
import ScrollToTop from '@code829/shared/components/shared/ScrollToTop';
import PublicLayout from './components/layout/PublicLayout';
import { useSessionRefresh } from '@code829/shared/hooks/useSessionRefresh';
import { useLocation } from 'react-router-dom';

const HomePage = lazy(() => import('./pages/home/HomePage'));
const EventsPage = lazy(() => import('./pages/events/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/event-detail/EventDetailPage'));
const LoginPage = lazy(() => import('./pages/login/LoginPage'));
const MyPurchasesPage = lazy(() => import('./pages/purchases/MyPurchasesPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const VerifyMagicLinkPage = lazy(() => import('./pages/auth/VerifyMagicLinkPage'));
const OnboardingPage = lazy(() => import('./pages/auth/OnboardingPage'));
const PurchaseDetailPage = lazy(() => import('./pages/purchases/PurchaseDetailPage'));
const PurchaseTicketsPage = lazy(() => import('./pages/purchases/PurchaseTicketsPage'));
const MyTicketsPage = lazy(() => import('./pages/tickets/MyTicketsPage'));
const GuestTicketsPage = lazy(() => import('./pages/tickets/GuestTicketsPage'));
const TicketClaimPage = lazy(() => import('./pages/tickets/TicketClaimPage'));
const FeedbackPage = lazy(() => import('./pages/feedback/FeedbackPage'));

function AppContent() {
  const location = useLocation();

  return (
    <Routes location={location}>
      <Route element={<PublicLayout />}>
        {/* Public */}
        <Route index element={<HomePage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:slug" element={<EventDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="auth/verify" element={<VerifyMagicLinkPage />} />
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="tickets/claim" element={<TicketClaimPage />} />
        <Route path="feedback" element={<FeedbackPage />} />

        {/* Authenticated Users */}
        <Route element={<ProtectedRoute />}>
          <Route path="purchases" element={<MyPurchasesPage />} />
          <Route path="purchases/:purchaseId" element={<PurchaseDetailPage />} />
          <Route path="purchases/:purchaseId/tickets" element={<PurchaseTicketsPage />} />
          <Route path="tickets" element={<MyTicketsPage />} />
          <Route path="guest-tickets" element={<GuestTicketsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  useSessionRefresh();

  return (
    <BrowserRouter>
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <AppContent />
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
