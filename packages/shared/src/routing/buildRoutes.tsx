import { lazy, type ReactElement } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import type { RouteConfig } from './types';

function renderConfig(config: RouteConfig, idx: number): ReactElement {
  const { path, index, loader, element, requiredRole, layout: Layout, children } = config;

  let leaf: React.ReactNode = element;
  if (!leaf && loader) {
    const Lazy = lazy(loader);
    leaf = <Lazy />;
  }

  // Layout branch: Layout renders via <Outlet />, children routes live inside.
  if (Layout) {
    const layoutEl = requiredRole ? (
      <ProtectedRoute minRole={requiredRole}>
        <Layout />
      </ProtectedRoute>
    ) : (
      <Layout />
    );
    return (
      <Route key={path ?? `idx-${idx}`} path={path} element={layoutEl}>
        {children?.map(renderConfig)}
      </Route>
    );
  }

  // Guarded group (no layout, no element): emit a pathless guard route whose
  // children render through <ProtectedRoute>'s <Outlet />.
  if (requiredRole && !leaf) {
    return (
      <Route
        key={`guard-${idx}`}
        element={<ProtectedRoute minRole={requiredRole} />}
      >
        {children?.map(renderConfig)}
      </Route>
    );
  }

  // Guarded leaf (no layout): wrap element with ProtectedRoute.
  if (requiredRole && leaf) {
    leaf = <ProtectedRoute minRole={requiredRole}>{leaf}</ProtectedRoute>;
  }

  if (index) {
    return <Route key={`index-${idx}`} index element={leaf} />;
  }

  return (
    <Route key={path ?? `r-${idx}`} path={path} element={leaf}>
      {children?.map(renderConfig)}
    </Route>
  );
}

/**
 * Expand a `RouteConfig[]` into a react-router `<Route>` tree. Consumers wrap
 * the result in `<Routes>` from the app's `<AppShell>`.
 */
export function buildRoutes(configs: RouteConfig[]): ReactElement[] {
  return configs.map(renderConfig);
}
