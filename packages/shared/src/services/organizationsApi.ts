import { BaseService } from './BaseService';
import type { PagedResponse } from '../types/shared';
import type {
  OrganizationCreateRequest,
  OrganizationDetail,
  OrganizationListItem,
  OrganizationMemberRequest,
  OrganizationUpdateRequest,
} from '../types/organizations';

export interface OrganizationListParams extends Record<string, unknown> {
  page?: number;
  pageSize?: number;
  search?: string;
  includeArchived?: boolean;
}

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

  addMember = (id: string, payload: OrganizationMemberRequest) =>
    this.post<OrganizationDetail>(`/developer/organizations/${id}/members`, payload);

  removeMember = (id: string, businessUserId: string) =>
    this.delete<OrganizationDetail>(`/developer/organizations/${id}/members/${businessUserId}`);
}

export const organizationsService = OrganizationsService.getInstance();

export const organizationsApi = {
  list: organizationsService.list,
  getById: organizationsService.getById,
  create: organizationsService.create,
  update: organizationsService.update,
  addMember: organizationsService.addMember,
  removeMember: organizationsService.removeMember,
};
