import { eventService } from './EventService';

export type {
  AdminEventListParams,
  EventTicketTypeInput,
  CreateEventPayload,
  UpdateEventPayload,
  EventStats,
} from './EventService';

export const adminEventsApi = {
  list: eventService.adminList,
  getById: eventService.adminGetById,
  create: eventService.create,
  update: eventService.update,
  changeStatus: eventService.changeStatus,
  delete: eventService.remove,
  duplicate: eventService.duplicate,
  uploadImage: eventService.uploadImage,
  checkLayoutLocked: eventService.checkLayoutLocked,
  getStats: eventService.getStats,
};
