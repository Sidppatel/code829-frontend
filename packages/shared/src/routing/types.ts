import type { ComponentType, LazyExoticComponent } from 'react';
import type { UserRole } from '../types/auth';

/**
 * Declarative route definition consumed by `buildRoutes`. Each app expresses
 * its page tree as `RouteConfig[]` instead of hand-written `<Routes>` JSX, so
 * cross-app concerns (Suspense fallback, ErrorBoundary, ProtectedRoute, lazy
 * loading, layouts) live in one place.
 */
export interface RouteConfig {
  /** Path segment (relative to parent). Omit for index route. */
  path?: string;
  /** Marks this as a react-router index route. */
  index?: boolean;
  /** Lazy page component loader. Mutually exclusive with `element`. */
  loader?: () => Promise<{ default: ComponentType<unknown> }>;
  /** Eager element (use for redirects / guards). */
  element?: React.ReactNode;
  /**
   * Minimum role required to enter this subtree. Children inherit the guard
   * unless they specify their own. `undefined` = public.
   */
  requiredRole?: UserRole;
  /**
   * Layout component rendered as the parent route's element; children render
   * via `<Outlet />`. Pair with `requiredRole` to produce a guarded layout.
   */
  layout?: ComponentType<{ children?: React.ReactNode }> | LazyExoticComponent<ComponentType<unknown>>;
  children?: RouteConfig[];
}
