import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NotFoundPage from '@code829/shared/components/shared/NotFoundPage';
import ErrorBoundary from '@code829/shared/components/shared/ErrorBoundary';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import ProtectedRoute from '@code829/shared/components/auth/ProtectedRoute';
import StaffLayout from './components/layout/StaffLayout';

const StaffLoginPage = lazy(() => import('./pages/login/StaffLoginPage'));
const StaffSignupPage = lazy(() => import('./pages/signup/StaffSignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/reset-password/ResetPasswordPage'));
const CheckInSelectPage = lazy(() => import('./pages/checkin/CheckInSelectPage'));
const CheckInPage = lazy(() => import('./pages/checkin/CheckInPage'));

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="login" element={<StaffLoginPage />} />
            <Route path="signup" element={<StaffSignupPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route element={<ProtectedRoute minRole="Staff"><StaffLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="checkin/select" replace />} />
              <Route path="checkin/select" element={<CheckInSelectPage />} />
              <Route path="checkin/:eventId" element={<CheckInPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
