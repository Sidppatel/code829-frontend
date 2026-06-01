export interface SponsorMetaItem {
  key: string;
  value: string | null;
  isPublic: boolean;
  sortOrder: number;
}

export interface Sponsor {
  id: string;
  name: string;
  slug: string;
  primaryImagePath: string | null;
  primaryImageUrl: string | null;
  meta: SponsorMetaItem[];
  eventCount: number;
  upcomingEventCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventSponsor {
  sponsorId: string;
  name: string;
  slug: string;
  primaryImageUrl: string | null;
  sortOrder: number;
  effectiveMeta: SponsorMetaItem[];
}

export interface CreateSponsorPayload {
  name: string;
  slug?: string | null;
  primaryImagePath?: string | null;
  meta?: SponsorMetaItem[];
}

export type UpdateSponsorPayload = Partial<CreateSponsorPayload>;

export interface EventSponsorLink {
  sponsorId: string;
  sortOrder: number;
  eventMeta?: SponsorMetaItem[];
}

export interface SetEventSponsorsPayload {
  sponsors: EventSponsorLink[];
}
