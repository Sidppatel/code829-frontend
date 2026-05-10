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

export function buildRoutes(configs: RouteConfig[]): ReactElement[] {
  return configs.map(renderConfig);
}
