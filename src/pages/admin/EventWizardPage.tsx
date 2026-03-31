import React from 'react';
import EventWizardPage from '../shared/EventWizardPage';
import { adminApi } from '../../services/adminApi';
import { RoleProvider } from '../../lib/roleContext';

export default function AdminEventWizardPage(): React.ReactElement {
  return (
    <RoleProvider api={adminApi} basePath="/admin" role="admin">
      <EventWizardPage />
    </RoleProvider>
  );
}
