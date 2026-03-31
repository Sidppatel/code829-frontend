import React, { createContext, useContext } from 'react';
import { adminApi } from '../services/adminApi';
import { developerApi } from '../services/developerApi';

type RoleApiType = typeof adminApi | typeof developerApi;

interface RoleContextValue {
  api: RoleApiType;
  basePath: string;
  role: 'admin' | 'developer';
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function useRoleContext(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRoleContext must be used within a RoleProvider');
  return ctx;
}

export function RoleProvider({ api, basePath, role, children }: RoleContextValue & { children: React.ReactNode }): React.ReactElement {
  return <RoleContext.Provider value={{ api, basePath, role }}>{children}</RoleContext.Provider>;
}
