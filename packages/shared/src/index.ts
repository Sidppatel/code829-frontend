export { useAuthStore } from './stores/authStore';

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
export { usePurchaseQuote } from './hooks/usePurchaseQuote';
export { useGuestTickets } from './hooks/useGuestTickets';
export type { UseGuestTicketsResult } from './hooks/useGuestTickets';

export { QueryProvider } from './providers/QueryProvider';
export { createQueryClient } from './providers/queryClient';

export {
  queryKeys,
  useEventsQuery,
  useEventDetailBySlugQuery,
  useEventDetailQuery,
  useEventTicketTypesQuery,
  useEventTablesQuery,
  useEventFacetsQuery,
  invalidateEventsQueries,
  usePurchasesQuery,
  usePurchaseDetailQuery,
  useCreatePurchaseMutation,
  useConfirmPurchaseMutation,
  useCancelPurchaseMutation,
  useGuestTicketsQuery,
  useTicketClaimInfoQuery,
  useClaimTicketMutation,
  useCurrentUserQuery,
  useLogoutMutation,
} from './queries';

export { TextField, SelectField, DateField, applyApiFieldErrors } from './forms';
export type { SelectOption } from './forms';

export * from './schemas';
export { useHomepageEvents } from './hooks/useHomepageEvents';
export type { UseHomepageEventsResult } from './hooks/useHomepageEvents';
export { useOrganizationStripeStatus } from './hooks/useOrganizationStripeStatus';
export { useAdminStripeStatus } from './hooks/useAdminStripeStatus';

export { ThemeProvider } from './context/ThemeContext';
export { ThemeContext } from './context/ThemeContextCore';
export type { ThemeMode, ThemeContextValue } from './context/ThemeContextCore';

export { hasRole } from './utils/roles';
export { centsToUSD } from './utils/currency';
export { formatEventDate, formatDateRange } from './utils/date';

export { default as apiClient } from './lib/axios';
export { createLogger } from './lib/logger';
export { default as logger } from './lib/logger';
export { initGlobalErrorListeners } from './lib/globalErrors';

export {
  BaseService,
  AuthService,
  authService,
  EventService,
  eventService,
  PurchaseService,
  purchaseService,
  TicketService,
  ticketService,
  CheckInService,
  checkInService,
  VenueService,
  venueService,
  PerformerService,
  performerService,
  SponsorService,
  sponsorService,
  LayoutService,
  layoutService,
  DashboardService,
  dashboardService,
  ImageService,
  imageService,
  FeedbackService,
  feedbackService,
  DeveloperService,
  developerService,
  authApi,
  adminAuthApi,
  eventsApi,
  adminEventsApi,
  purchasesApi,
  adminPurchasesApi,
  tablePurchaseApi,
  ticketsApi,
  checkInApi,
  adminVenuesApi,
  adminLayoutApi,
  adminDashboardApi,
  imagesApi,
  feedbackApi,
  developerApi,
  OrganizationsService,
  organizationsService,
  organizationsApi,
  StripeConnectService,
  stripeConnectService,
  stripeConnectApi,
} from './services';
export type { OrganizationListParams } from './services';

export {
  BaseController,
  AuthController, authController,
  EventController, eventController,
  PurchaseController, purchaseController,
  TicketController, ticketController,
  CheckInController, checkInController,
  VenueController, venueController,
  LayoutController, layoutController,
} from './controllers';

export {
  BaseViewModel,
  useVMState,
  EventListViewModel, useEventListVM,
  EventDetailViewModel, useEventDetailVM,
  PurchaseQuoteViewModel, usePurchaseQuoteVM,
  AuthViewModel, useAuthVM,
} from './viewmodels';
export type {
  UseEventListVMResult,
  UseEventDetailVMResult,
  UsePurchaseQuoteVMResult,
  UseAuthVMResult,
} from './viewmodels';

export { STATUS_COLORS, EVENT_STATUS_COLORS, LOG_SEVERITY_COLORS, EMAIL_STATUS_COLORS } from './theme/statusColors';
export { portalCardStyle, portalPanelStyle, portalElevatedStyle } from './theme/portalStyles';
export { palette, semantic, status, cssVars, chartPalette, shadows, gradients, tablePickerPresets, applyThemeVars } from './theme/colors';

export { ThemedApp } from './components/ThemedApp';
export { default as ProtectedRoute } from './components/auth/ProtectedRoute';
export { default as AdminLoginForm } from './components/auth/AdminLoginForm';
export { default as InvitationSignupForm } from './components/auth/InvitationSignupForm';
export { default as ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
export { default as ResetPasswordForm } from './components/auth/ResetPasswordForm';

export type {
  AuthResponse, UserProfile, UserRole, AdminRole,
  BusinessUserProfile, BusinessUserListItem, BusinessAuthResponse, InvitationInfoDto,
} from './types/auth';
export type { Purchase, PurchaseStatus } from './types/purchase';
export type {
  Performer,
  PerformerMetaItem,
  EventPerformer,
  EventPerformerLink,
  CreatePerformerPayload,
  UpdatePerformerPayload,
  SetEventPerformersPayload,
} from './types/performer';
export type {
  Sponsor,
  SponsorMetaItem,
  EventSponsor,
  EventSponsorLink,
  CreateSponsorPayload,
  UpdateSponsorPayload,
  SetEventSponsorsPayload,
} from './types/sponsor';
export type {
  OnboardingLinkScope,
  OrganizationStripeState,
  OrganizationMemberSummary,
  OrganizationListItem,
  OrganizationDetail,
  OrganizationCreateRequest,
  OrganizationUpdateRequest,
  OrganizationMemberRequest,
  StripeOnboardingLinkRequest,
  StripeOnboardingLinkResponse,
  StripeOnboardingEmailRequest,
  StripeOnboardingEmailResponse,
  StripeAccountStatus,
  OrganizationStripeStatus,
} from './types/organizations';
