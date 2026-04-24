import { useQuery, type QueryClient } from '@tanstack/react-query';
import { eventsApi } from '../services/eventsApi';
import type { EventListParams } from '../services/EventService';
import { queryKeys } from './keys';

export function useEventsQuery(filters?: EventListParams) {
  return useQuery({
    queryKey: queryKeys.events.list(filters),
    queryFn: async () => (await eventsApi.list(filters)).data,
  });
}

export function useEventDetailBySlugQuery(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.events.detailBySlug(slug ?? ''),
    queryFn: async () => (await eventsApi.getBySlug(slug!)).data,
    enabled: !!slug,
  });
}

export function useEventDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.events.detailById(id ?? ''),
    queryFn: async () => (await eventsApi.getById(id!)).data,
    enabled: !!id,
  });
}

export function useEventTicketTypesQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.events.ticketTypes(id ?? ''),
    queryFn: async () => (await eventsApi.getTicketTypes(id!)).data,
    enabled: !!id,
  });
}

export function useEventTablesQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.events.tables(id ?? ''),
    queryFn: async () => (await eventsApi.getTables(id!)).data,
    enabled: !!id,
  });
}

export function useEventFacetsQuery() {
  return useQuery({
    queryKey: queryKeys.events.facets(),
    queryFn: async () => (await eventsApi.getFacets()).data,
  });
}

export function invalidateEventsQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
}
