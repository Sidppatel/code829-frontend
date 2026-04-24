import { BaseService } from './BaseService';
import type { PagedResponse } from '../types/shared';
import type {
  OrganizationCreateRequest,
  OrganizationDetail,
  OrganizationListItem,
  OrganizationMemberRequest,
  OrganizationUpdateRequest,
} from '../types/organizations';

/** Query params for `GET /developer/organizations`. */
export interface OrganizationListParams extends Record<string, unknown> {
  page?: number;
  pageSize?: number;
  /** Free-text search over `name` / `legalName` (BE handles ILIKE). */
  search?: string;
  /** Include soft-deleted orgs in the result set. Defaults to `false` on the BE. */
  includeArchived?: boolean;
}

/**
 * Developer-side CRUD client for the `Organization` aggregate.
 *
 * All endpoints under `/developer/organizations[/...]` and require the developer
 * portal session cookie + `X-Portal: developer` header (set globally by
 * `configureApiClient`). The BE enforces `[RequireRole(UserRole.Developer)]`
 * on every route.
 *
 * Stripe Connect onboarding endpoints (account creation, onboarding link, status)
 * live separately in `stripeConnectApi` — keep this file focused on shape-of-org
 * concerns to make membership audits easy.
 */
export class OrganizationsService extends BaseService {
  private static _instance: OrganizationsService | null = null;
  static getInstance(): OrganizationsService {
    return (this._instance ??= new OrganizationsService());
  }
  private constructor() {
    super('OrganizationsService');
  }

  list = (params?: OrganizationListParams) =>
    this.get<PagedResponse<OrganizationListItem>>('/developer/organizations', { params });

  getById = (id: string) => this.get<OrganizationDetail>(`/developer/organizations/${id}`);

  create = (payload: OrganizationCreateRequest) =>
    this.post<OrganizationDetail>('/developer/organizations', payload);

  update = (id: string, payload: OrganizationUpdateRequest) =>
    this.put<OrganizationDetail>(`/developer/organizations/${id}`, payload);

  /** Adds an existing BusinessUser to the organization. Idempotent on the BE side
   *  (200 with the unchanged member list when the user is already a member). */
  addMember = (id: string, payload: OrganizationMemberRequest) =>
    this.post<OrganizationDetail>(`/developer/organizations/${id}/members`, payload);

  /** Detaches a member. BE 409s if removing the last member of an org that has an
   *  active StripeConnectedAccountId — caller must move the user to another org first. */
  removeMember = (id: string, businessUserId: string) =>
    this.delete<OrganizationDetail>(`/developer/organizations/${id}/members/${businessUserId}`);
}

export const organizationsService = OrganizationsService.getInstance();

/** Functional re-export to match the per-portal `*Api` convention used by the
 *  rest of the package. */
export const organizationsApi = {
  list: organizationsService.list,
  getById: organizationsService.getById,
  create: organizationsService.create,
  update: organizationsService.update,
  addMember: organizationsService.addMember,
  removeMember: organizationsService.removeMember,
};
