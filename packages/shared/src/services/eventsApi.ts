import { eventService } from './EventService';

export type { EventListParams } from './EventService';

export const eventsApi = {
  list: eventService.list,
  getById: eventService.getById,
  getBySlug: eventService.getBySlug,
  getFacets: eventService.getFacets,
  getTables: eventService.getTables,
  getSchemaOrg: eventService.getSchemaOrg,
  getSeoMeta: eventService.getSeoMeta,
  getItemListSchema: eventService.getItemListSchema,
  getTicketTypes: eventService.getTicketTypes,
};
