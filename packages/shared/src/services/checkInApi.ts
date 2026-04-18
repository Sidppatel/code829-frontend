import { checkInService } from './CheckInService';

export const checkInApi = {
  scan: checkInService.scan,
  getStats: checkInService.getStats,
};
