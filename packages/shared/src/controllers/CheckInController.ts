import { BaseController } from './BaseController';
import { checkInService, CheckInService } from '../services/CheckInService';

export class CheckInController extends BaseController {
  private static _instance: CheckInController | null = null;
  static getInstance(): CheckInController {
    return (this._instance ??= new CheckInController());
  }
  private readonly svc: CheckInService;
  private constructor(svc: CheckInService = checkInService) {
    super();
    this.svc = svc;
  }

  async scan(qrToken: string) {
    const { data } = await this.svc.scan(qrToken);
    this.emit('checkin:scanned', data);
    return data;
  }

  getStats = async (eventId: string) => (await this.svc.getStats(eventId)).data;
}

export const checkInController = CheckInController.getInstance();
