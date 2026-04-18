/**
 * Class-based ViewModels. Each VM owns UI state for a page/widget, subscribes
 * to controller events, and exposes `getState` / `subscribe` so React
 * consumes it via `useSyncExternalStore` (see `useVM.ts`).
 *
 * Phase 1 seeds only — more VMs land as pages migrate in Phase 2.
 */

export { BaseViewModel } from './BaseViewModel';
export { useVMState } from './useVM';

export { EventListViewModel, useEventListVM } from './EventListViewModel';
export type { UseEventListVMResult } from './EventListViewModel';

export { EventDetailViewModel, useEventDetailVM } from './EventDetailViewModel';
export type { UseEventDetailVMResult } from './EventDetailViewModel';

export { PurchaseQuoteViewModel, usePurchaseQuoteVM } from './PurchaseQuoteViewModel';
export type { UsePurchaseQuoteVMResult } from './PurchaseQuoteViewModel';
export { BookingQuoteViewModel, useBookingQuoteVM } from './BookingQuoteViewModel';
export type { UseBookingQuoteVMResult } from './BookingQuoteViewModel';

export { AuthViewModel, useAuthVM } from './AuthViewModel';
export type { UseAuthVMResult } from './AuthViewModel';
