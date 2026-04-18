import { bookingService } from './BookingService';

export const tableBookingApi = {
  lockTable: bookingService.lockTable,
  releaseTable: bookingService.releaseTable,
  getMyLocks: bookingService.getMyLocks,
};
