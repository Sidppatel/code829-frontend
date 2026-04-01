export interface PricingRule {
  id: string;
  eventId: string;
  name: string;
  ruleType: string;
  adjustmentType: string;
  adjustmentValue: number;
  priority: number;
  isActive: boolean;
  conditions?: Record<string, unknown>;
  createdAt: string;
}
