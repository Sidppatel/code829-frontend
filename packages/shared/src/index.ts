// Stores
export { useAuthStore } from './stores/authStore';

// Hooks
export { useAuth } from './hooks/useAuth';
export { useBreakpoint } from './hooks/useBreakpoint';
export { useHoldTimer } from './hooks/useHoldTimer';
export { useIsMobile } from './hooks/useIsMobile';
export { usePagedTable } from './hooks/usePagedTable';
export { useTheme } from './hooks/useTheme';
export { useConfirm } from './hooks/useConfirm';
export { useCrudModal } from './hooks/useCrudModal';
export type { CrudMode, UseCrudModalResult } from './hooks/useCrudModal';
export { useAsyncAction } from './hooks/useAsyncAction';
export type { UseAsyncActionResult } from './hooks/useAsyncAction';
export { useAsyncResource } from './hooks/useAsyncResource';
export type { UseAsyncResourceResult } from './hooks/useAsyncResource';
export { useDebouncedSearch } from './hooks/useDebouncedSearch';
export type { UseDebouncedSearchResult } from './hooks/useDebouncedSearch';
export { useExport } from './hooks/useExport';
export type { UseExportFetchers, UseExportResult } from './hooks/useExport';
export { useQrCode } from './hooks/useQrCode';
export type { QrFetcher, UseQrCodeResult } from './hooks/useQrCode';
export { usePaymentIntentConfirmation } from './hooks/usePaymentIntentConfirmation';
export { useGuestTickets } from './hooks/useGuestTickets';
export type { UseGuestTicketsResult } from './hooks/useGuestTickets';

// Context
export { ThemeProvider } from './context/ThemeContext';
export { ThemeContext } from './context/ThemeContextCore';
export type { ThemeMode, ThemeContextValue } from './context/ThemeContextCore';

// Utils
export { hasRole } from './utils/roles';
export { centsToUSD } from './utils/currency';
export { formatEventDate, formatDateRange } from './utils/date';

// Lib
export { default as apiClient } from './lib/axios';
export { createLogger } from './lib/logger';
export { default as logger } from './lib/logger';
export { initGlobalErrorListeners } from './lib/globalErrors';

// Services
export { authApi } from './services/authApi';
export { adminAuthApi } from './services/adminAuthApi';
export { imagesApi } from './services/imagesApi';
export { checkInApi } from './services/checkInApi';
export { eventsApi } from './services/eventsApi';
export { bookingsApi } from './services/bookingsApi';
export { ticketsApi } from './services/ticketsApi';
export { tableBookingApi } from './services/tableBookingApi';
export { feedbackApi } from './services/feedbackApi';
export { adminEventsApi } from './services/adminEventsApi';
export { adminBookingsApi } from './services/adminBookingsApi';
export { adminVenuesApi } from './services/adminVenuesApi';
export { adminLayoutApi } from './services/adminLayoutApi';
export { adminDashboardApi } from './services/adminDashboardApi';
export { developerApi } from './services/developerApi';

// Theme
export { STATUS_COLORS, EVENT_STATUS_COLORS, LOG_SEVERITY_COLORS, EMAIL_STATUS_COLORS } from './theme/statusColors';
export { portalCardStyle, portalPanelStyle, portalElevatedStyle } from './theme/portalStyles';
export { palette, semantic, status, cssVars, chartPalette, shadows, gradients, tablePickerPresets, applyThemeVars } from './theme/colors';

// Components
export { ThemedApp } from './components/ThemedApp';
export { default as ProtectedRoute } from './components/auth/ProtectedRoute';
export { default as AdminLoginForm } from './components/auth/AdminLoginForm';
export { default as InvitationSignupForm } from './components/auth/InvitationSignupForm';
export { default as ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
export { default as ResetPasswordForm } from './components/auth/ResetPasswordForm';

// Types (re-export for convenience)
export type {
  AuthResponse, UserProfile, UserRole, AdminRole,
  AdminUserProfile, AdminAuthResponse, InvitationInfoDto,
} from './types/auth';
