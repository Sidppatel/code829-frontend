import apiClient from '../lib/axios';
import type { ScanResponse, CheckInStats } from '../types/checkin';

export const checkInApi = {
  scan: (qrToken: string) =>
    apiClient.post<ScanResponse>('/checkin/scan', { qrToken }),

  getStats: (eventId: string) =>
    apiClient.get<CheckInStats>(`/checkin/events/${eventId}/stats`),
};
