import apiClient from '../lib/axios';
import type { PricingRule } from '../types/pricing';

export const adminPricingApi = {
  list: (eventId: string) =>
    apiClient.get<PricingRule[]>(`/admin/events/${eventId}/pricing`),

  resolve: (eventId: string) =>
    apiClient.get(`/admin/events/${eventId}/pricing/resolve`),

  create: (eventId: string, payload: Partial<PricingRule>) =>
    apiClient.post(`/admin/events/${eventId}/pricing`, payload),

  update: (eventId: string, ruleId: string, payload: Partial<PricingRule>) =>
    apiClient.put(`/admin/events/${eventId}/pricing/${ruleId}`, payload),

  delete: (eventId: string, ruleId: string) =>
    apiClient.delete(`/admin/events/${eventId}/pricing/${ruleId}`),

  reorder: (eventId: string, ruleIds: string[]) =>
    apiClient.put(`/admin/events/${eventId}/pricing/reorder`, { ruleIds }),
};
