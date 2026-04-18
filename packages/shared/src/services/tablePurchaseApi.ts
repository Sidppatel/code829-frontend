import { purchaseService } from './PurchaseService';

export const tablePurchaseApi = {
  lockTable: purchaseService.lockTable,
  releaseTable: purchaseService.releaseTable,
  getMyLocks: purchaseService.getMyLocks,
};
