import { bookingService } from './BookingService';

export type { CreateBookingRequest } from './BookingService';

export const bookingsApi = {
  create: bookingService.create,
  confirmPayment: bookingService.confirmPayment,
  confirmByPaymentIntent: bookingService.confirmByPaymentIntent,
  cancel: bookingService.cancel,
  getById: bookingService.getById,
  getMine: bookingService.getMine,
  getQrCode: bookingService.getQrCode,
  getStripeConfig: bookingService.getStripeConfig,
  getQuote: bookingService.getQuote,
};
