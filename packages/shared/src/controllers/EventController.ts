import { BaseController } from './BaseController';
import {
  eventService,
  EventService,
  type EventListParams,
  type AdminEventListParams,
  type CreateEventPayload,
  type UpdateEventPayload,
} from '../services/EventService';

export class EventController extends BaseController {
  private static _instance: EventController | null = null;
  static getInstance(): EventController {
    return (this._instance ??= new EventController());
  }
  private readonly svc: EventService;
  private constructor(svc: EventService = eventService) {
    super();
    this.svc = svc;
  }

  list = async (params?: EventListParams) => (await this.svc.list(params)).data;
  getById = async (id: string) => (await this.svc.getById(id)).data;
  getBySlug = async (slug: string) => (await this.svc.getBySlug(slug)).data;
  getFacets = async () => (await this.svc.getFacets()).data;
  getTables = async (id: string) => (await this.svc.getTables(id)).data;
  getTicketTypes = async (id: string) => (await this.svc.getTicketTypes(id)).data;

  // Admin
  adminList = async (params?: AdminEventListParams) => (await this.svc.adminList(params)).data;
  adminGetById = async (id: string) => (await this.svc.adminGetById(id)).data;

  async create(payload: CreateEventPayload) {
    const { data } = await this.svc.create(payload);
    this.emit('event:created', data);
    return data;
  }

  async update(id: string, payload: UpdateEventPayload) {
    const { data } = await this.svc.update(id, payload);
    this.emit('event:updated', data);
    return data;
  }

  async changeStatus(id: string, status: string) {
    const { data } = await this.svc.changeStatus(id, status);
    this.emit('event:updated', data);
    return data;
  }

  async remove(id: string) {
    await this.svc.remove(id);
    this.emit('event:removed', { id });
  }

  getStats = async (id: string) => (await this.svc.getStats(id)).data;
}

export const eventController = EventController.getInstance();
