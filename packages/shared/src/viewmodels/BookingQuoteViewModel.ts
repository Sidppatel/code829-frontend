// Renamed to PurchaseQuoteViewModel. Explicit re-exports to avoid Vite aliased-reexport edge cases.
import { PurchaseQuoteViewModel, usePurchaseQuoteVM } from './PurchaseQuoteViewModel';
import type { UsePurchaseQuoteVMResult } from './PurchaseQuoteViewModel';

export const BookingQuoteViewModel = PurchaseQuoteViewModel;
export const useBookingQuoteVM = usePurchaseQuoteVM;
export type { UsePurchaseQuoteVMResult as UseBookingQuoteVMResult };
