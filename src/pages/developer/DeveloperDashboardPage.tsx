import React from 'react';
import DashboardPage from '../shared/DashboardPage';
import { developerApi } from '../../services/developerApi';
import { RoleProvider } from '../../lib/roleContext';

export default function DeveloperDashboardPage(): React.ReactElement {
  return (
    <RoleProvider api={developerApi} basePath="/developer" role="developer">
      <DashboardPage />
    </RoleProvider>
  );
}
