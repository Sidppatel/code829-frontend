import { layoutService } from './LayoutService';

export type {
  TablePayload,
  SaveLayoutPayload,
  CreateTableTemplatePayload,
  CreateEventTablePayload,
  UpdateEventTablePayload,
} from './LayoutService';

export const adminLayoutApi = {
  listTableTemplates: layoutService.listTableTemplates,
  createTableTemplate: layoutService.createTableTemplate,
  updateTableTemplate: layoutService.updateTableTemplate,
  deleteTableTemplate: layoutService.deleteTableTemplate,
  listEventTables: layoutService.listEventTables,
  createEventTable: layoutService.createEventTable,
  updateEventTable: layoutService.updateEventTable,
  deleteEventTable: layoutService.deleteEventTable,
  getLayout: layoutService.getLayout,
  saveLayout: layoutService.saveLayout,
  getDraft: layoutService.getDraft,
  saveDraft: layoutService.saveDraft,
  flushDraft: layoutService.flushDraft,
  addTable: layoutService.addTable,
  updateTable: layoutService.updateTable,
  deleteTable: layoutService.deleteTable,
  getLayoutStatus: layoutService.getLayoutStatus,
  getLockedTables: layoutService.getLockedTables,
  getLayoutStats: layoutService.getLayoutStats,
  bulkInsertTables: layoutService.bulkInsertTables,
};
