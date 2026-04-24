export const queryKeys = {
  events: {
    all: ['events'] as const,
    list: (filters?: unknown) => ['events', 'list', filters ?? {}] as const,
    detailBySlug: (slug: string) => ['events', 'slug', slug] as const,
    detailById: (id: string) => ['events', 'id', id] as const,
    ticketTypes: (id: string) => ['events', id, 'ticket-types'] as const,
    tables: (id: string) => ['events', id, 'tables'] as const,
    facets: () => ['events', 'facets'] as const,
  },
  purchases: {
    all: ['purchases'] as const,
    mine: () => ['purchases', 'mine'] as const,
    detail: (id: string) => ['purchases', id] as const,
  },
  tickets: {
    all: ['tickets'] as const,
    mine: () => ['tickets', 'mine'] as const,
    guest: (token: string) => ['tickets', 'guest', token] as const,
    claimInfo: (token: string) => ['tickets', 'claim-info', token] as const,
  },
  auth: {
    me: () => ['auth', 'me'] as const,
  },
};
