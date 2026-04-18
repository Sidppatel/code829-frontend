/**
 * Class-based controllers. Each controller is a singleton that orchestrates
 * one or more services and emits domain events via a tiny EventTarget bus.
 * Controllers hold no React state — ViewModels subscribe and own UI state.
 */

export { BaseController } from './BaseController';

export { AuthController, authController } from './AuthController';
export { EventController, eventController } from './EventController';
export { BookingController, bookingController } from './BookingController';
export { TicketController, ticketController } from './TicketController';
export { CheckInController, checkInController } from './CheckInController';
export { VenueController, venueController } from './VenueController';
export { LayoutController, layoutController } from './LayoutController';
