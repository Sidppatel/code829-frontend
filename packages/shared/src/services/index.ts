/**
 * Class-based service layer. Every service extends `BaseService` and is exposed
 * as a singleton. Old functional exports (`authApi`, `eventsApi`, …) still live
 * in their respective files as thin delegates so existing callers keep working
 * until pages migrate in Phase 2.
 */

export { BaseService } from './BaseService';

export { AuthService, authService } from './AuthService';
export type {
  UpdateProfilePayload,
  AcceptInvitationRequest,
  UpdateAdminProfilePayload,
  ChangeAdminPasswordPayload,
} from './AuthService';

export { EventService, eventService } from './EventService';
export type {
  EventListParams,
  AdminEventListParams,
  EventTicketTypeInput,
  CreateEventPayload,
  UpdateEventPayload,
  EventStats,
} from './EventService';

export { PurchaseService, purchaseService } from './PurchaseService';
export type { CreatePurchaseRequest, AdminPurchaseListParams } from './PurchaseService';
export { BookingService, bookingService } from './BookingService';
export type { CreateBookingRequest, AdminBookingListParams } from './BookingService';

export { TicketService, ticketService } from './TicketService';

export { CheckInService, checkInService } from './CheckInService';

export { VenueService, venueService } from './VenueService';
export type { CreateVenuePayload } from './VenueService';

export { LayoutService, layoutService } from './LayoutService';
export type {
  TablePayload,
  SaveLayoutPayload,
  CreateTableTemplatePayload,
  CreateEventTablePayload,
  UpdateEventTablePayload,
} from './LayoutService';

export { DashboardService, dashboardService } from './DashboardService';

export { ImageService, imageService } from './ImageService';

export { FeedbackService, feedbackService } from './FeedbackService';
export type { SubmitFeedbackRequest } from './FeedbackService';

export { DeveloperService, developerService } from './DeveloperService';
export type {
  DevLogEntry,
  DevLogParams,
  EmailLogEntry,
  AppSetting,
  SecretStatus,
  SettingsResponse,
  DevUser,
  EventFeeInfo,
  DevEventListItem,
} from './DeveloperService';

// ── Legacy functional re-exports (kept for back-compat; migrate callers in Phase 2) ──
export { authApi } from './authApi';
export { adminAuthApi } from './adminAuthApi';
export { eventsApi } from './eventsApi';
export { adminEventsApi } from './adminEventsApi';
export { purchasesApi } from './purchasesApi';
export { adminPurchasesApi } from './adminPurchasesApi';
export { tablePurchaseApi } from './tablePurchaseApi';
export { bookingsApi } from './bookingsApi';
export { adminBookingsApi } from './adminBookingsApi';
export { tableBookingApi } from './tableBookingApi';
export { ticketsApi } from './ticketsApi';
export { checkInApi } from './checkInApi';
export { adminVenuesApi } from './adminVenuesApi';
export { adminLayoutApi } from './adminLayoutApi';
export { adminDashboardApi } from './adminDashboardApi';
export { imagesApi } from './imagesApi';
export { feedbackApi } from './feedbackApi';
export { developerApi } from './developerApi';
