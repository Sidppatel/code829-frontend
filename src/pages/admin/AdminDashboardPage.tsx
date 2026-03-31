import React from 'react';
import DashboardPage from '../shared/DashboardPage';
import { adminApi } from '../../services/adminApi';
import { RoleProvider } from '../../lib/roleContext';

export default function AdminDashboardPage(): React.ReactElement {
  return (
    <RoleProvider api={adminApi} basePath="/admin" role="admin">
      <DashboardPage />
    </RoleProvider>
  );
}
