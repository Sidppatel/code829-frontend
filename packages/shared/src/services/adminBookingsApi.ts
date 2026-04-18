import { bookingService } from './BookingService';

export type { AdminBookingListParams } from './BookingService';

export const adminBookingsApi = {
  list: bookingService.adminList,
  getStats: bookingService.adminGetStats,
  refund: bookingService.refund,
  exportCsv: bookingService.exportCsv,
  exportXlsx: bookingService.exportXlsx,
};
