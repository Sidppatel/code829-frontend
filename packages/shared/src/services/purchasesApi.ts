import { purchaseService } from './PurchaseService';

export type { CreatePurchaseRequest } from './PurchaseService';

export const purchasesApi = {
  create: purchaseService.create,
  confirmPayment: purchaseService.confirmPayment,
  confirmByPaymentIntent: purchaseService.confirmByPaymentIntent,
  cancel: purchaseService.cancel,
  getById: purchaseService.getById,
  getMine: purchaseService.getMine,
  getQrCode: purchaseService.getQrCode,
  getStripeConfig: purchaseService.getStripeConfig,
  getQuote: purchaseService.getQuote,
};
