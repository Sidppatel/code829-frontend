import { venueService } from './VenueService';

export type { CreateVenuePayload } from './VenueService';

export const adminVenuesApi = {
  list: venueService.list,
  getById: venueService.getById,
  create: venueService.create,
  update: venueService.update,
  delete: venueService.remove,
  uploadImage: venueService.uploadImage,
};
