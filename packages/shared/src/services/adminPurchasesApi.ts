import { purchaseService } from './PurchaseService';

export type { AdminPurchaseListParams } from './PurchaseService';

export const adminPurchasesApi = {
  list: purchaseService.adminList,
  getStats: purchaseService.adminGetStats,
  refund: purchaseService.refund,
  exportCsv: purchaseService.exportCsv,
  exportXlsx: purchaseService.exportXlsx,
};
