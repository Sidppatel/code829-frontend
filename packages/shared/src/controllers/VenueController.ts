import { BaseController } from './BaseController';
import { venueService, VenueService, type CreateVenuePayload } from '../services/VenueService';

export class VenueController extends BaseController {
  private static _instance: VenueController | null = null;
  static getInstance(): VenueController {
    return (this._instance ??= new VenueController());
  }
  private readonly svc: VenueService;
  private constructor(svc: VenueService = venueService) {
    super();
    this.svc = svc;
  }

  list = async (page = 1, pageSize = 20) => (await this.svc.list(page, pageSize)).data;
  getById = async (id: string) => (await this.svc.getById(id)).data;

  async create(payload: CreateVenuePayload) {
    const { data } = await this.svc.create(payload);
    this.emit('venue:created', data);
    return data;
  }

  async update(id: string, payload: Partial<CreateVenuePayload> & { isActive?: boolean }) {
    const { data } = await this.svc.update(id, payload);
    this.emit('venue:updated', data);
    return data;
  }

  async remove(id: string) {
    await this.svc.remove(id);
    this.emit('venue:removed', { id });
  }

  uploadImage = async (id: string, file: File) => (await this.svc.uploadImage(id, file)).data;
}

export const venueController = VenueController.getInstance();
