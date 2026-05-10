import type { ComponentType, LazyExoticComponent } from 'react';
import type { UserRole } from '../types/auth';

export interface RouteConfig {
  path?: string;
  index?: boolean;
  loader?: () => Promise<{ default: ComponentType<unknown> }>;
  element?: React.ReactNode;
  requiredRole?: UserRole;
  layout?: ComponentType<{ children?: React.ReactNode }> | LazyExoticComponent<ComponentType<unknown>>;
  children?: RouteConfig[];
}
