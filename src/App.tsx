import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/shared/ErrorBoundary';
import LoadingSpinner from './components/shared/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicLayout from './components/layout/PublicLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const HomePage = lazy(() => import('./pages/home/HomePage'));
const EventsPage = lazy(() => import('./pages/events/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/event-detail/EventDetailPage'));
const LoginPage = lazy(() => import('./pages/login/LoginPage'));
const MyBookingsPage = lazy(() => import('./pages/bookings/MyBookingsPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));

const VerifyMagicLinkPage = lazy(() => import('./pages/auth/VerifyMagicLinkPage'));
const OnboardingPage = lazy(() => import('./pages/auth/OnboardingPage'));
const BookingDetailPage = lazy(() => import('./pages/bookings/BookingDetailPage'));
const BookingTicketsPage = lazy(() => import('./pages/bookings/BookingTicketsPage'));
const MyTicketsPage = lazy(() => import('./pages/tickets/MyTicketsPage'));
const TicketClaimPage = lazy(() => import('./pages/tickets/TicketClaimPage'));
const FeedbackPage = lazy(() => import('./pages/feedback/FeedbackPage'));

function AppContent() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <Routes location={location} key={location.pathname}>
          {/* Public */}
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/:slug" element={<EventDetailPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="auth/verify" element={<VerifyMagicLinkPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="tickets/claim" element={<TicketClaimPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
          </Route>

          {/* Authenticated Users */}
          <Route element={<ProtectedRoute><PublicLayout /></ProtectedRoute>}>
            <Route path="bookings" element={<MyBookingsPage />} />
            <Route path="bookings/:bookingId" element={<BookingDetailPage />} />
            <Route path="bookings/:bookingId/tickets" element={<BookingTicketsPage />} />
            <Route path="tickets" element={<MyTicketsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <AppContent />
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

