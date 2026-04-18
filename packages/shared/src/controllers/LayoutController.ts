import { BaseController } from './BaseController';
import {
  layoutService,
  LayoutService,
  type SaveLayoutPayload,
  type CreateTableTemplatePayload,
  type CreateEventTablePayload,
  type UpdateEventTablePayload,
  type TablePayload,
} from '../services/LayoutService';

export class LayoutController extends BaseController {
  private static _instance: LayoutController | null = null;
  static getInstance(): LayoutController {
    return (this._instance ??= new LayoutController());
  }
  private readonly svc: LayoutService;
  private constructor(svc: LayoutService = layoutService) {
    super();
    this.svc = svc;
  }

  // Templates
  listTemplates = async () => (await this.svc.listTableTemplates()).data;
  createTemplate = async (data: CreateTableTemplatePayload) =>
    (await this.svc.createTableTemplate(data)).data;
  updateTemplate = async (id: string, data: CreateTableTemplatePayload) =>
    (await this.svc.updateTableTemplate(id, data)).data;
  deleteTemplate = async (id: string) => (await this.svc.deleteTableTemplate(id)).data;

  // Event tables
  listEventTables = async (eventId: string) =>
    (await this.svc.listEventTables(eventId)).data;
  createEventTable = async (eventId: string, data: CreateEventTablePayload) =>
    (await this.svc.createEventTable(eventId, data)).data;
  updateEventTable = async (eventId: string, id: string, data: UpdateEventTablePayload) =>
    (await this.svc.updateEventTable(eventId, id, data)).data;
  deleteEventTable = async (eventId: string, id: string) =>
    (await this.svc.deleteEventTable(eventId, id)).data;

  // Layout
  getLayout = async (eventId: string) => (await this.svc.getLayout(eventId)).data;
  async saveLayout(eventId: string, payload: SaveLayoutPayload) {
    const { data } = await this.svc.saveLayout(eventId, payload);
    this.emit('layout:saved', { eventId });
    return data;
  }
  getDraft = async (eventId: string) => (await this.svc.getDraft(eventId)).data;
  saveDraft = async (eventId: string, payload: SaveLayoutPayload) =>
    (await this.svc.saveDraft(eventId, payload)).data;
  flushDraft = async (eventId: string) => (await this.svc.flushDraft(eventId)).data;

  addTable = async (eventId: string, payload: Omit<TablePayload, 'id'>) =>
    (await this.svc.addTable(eventId, payload)).data;
  updateTable = async (eventId: string, tableId: string, payload: Partial<TablePayload>) =>
    (await this.svc.updateTable(eventId, tableId, payload)).data;
  deleteTable = async (eventId: string, tableId: string) =>
    (await this.svc.deleteTable(eventId, tableId)).data;

  getLayoutStatus = async (eventId: string) =>
    (await this.svc.getLayoutStatus(eventId)).data;
  getLockedTables = async (eventId: string) =>
    (await this.svc.getLockedTables(eventId)).data;
  getLayoutStats = async (eventId: string) =>
    (await this.svc.getLayoutStats(eventId)).data;
  bulkInsertTables = async (eventId: string, ids: string[]) =>
    (await this.svc.bulkInsertTables(eventId, ids)).data;
}

export const layoutController = LayoutController.getInstance();
