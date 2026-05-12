export interface PerformerMetaItem {
  key: string;
  value: string | null;
  isPublic: boolean;
  sortOrder: number;
}

export interface Performer {
  id: string;
  name: string;
  slug: string;
  primaryImagePath: string | null;
  primaryImageUrl: string | null;
  meta: PerformerMetaItem[];
  eventCount: number;
  upcomingEventCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventPerformer {
  performerId: string;
  name: string;
  slug: string;
  primaryImageUrl: string | null;
  sortOrder: number;
  effectiveMeta: PerformerMetaItem[];
}

export interface CreatePerformerPayload {
  name: string;
  slug?: string | null;
  primaryImagePath?: string | null;
  meta?: PerformerMetaItem[];
}

export type UpdatePerformerPayload = Partial<CreatePerformerPayload>;

export interface EventPerformerLink {
  performerId: string;
  sortOrder: number;
  eventMeta?: PerformerMetaItem[];
}

export interface SetEventPerformersPayload {
  performers: EventPerformerLink[];
}
