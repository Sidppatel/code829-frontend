import { BaseService } from './BaseService';
import type { ScanResponse, CheckInStats } from '../types/checkin';

export class CheckInService extends BaseService {
  private static _instance: CheckInService | null = null;
  static getInstance(): CheckInService {
    return (this._instance ??= new CheckInService());
  }
  private constructor() {
    super('CheckInService');
  }

  scan = (qrToken: string) => this.post<ScanResponse>('/checkin/scan', { qrToken });

  getStats = (eventId: string) =>
    this.get<CheckInStats>(`/checkin/events/${eventId}/stats`);
}

export const checkInService = CheckInService.getInstance();
