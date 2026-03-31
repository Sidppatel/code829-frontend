import React from 'react';
import EventWizardPage from '../shared/EventWizardPage';
import { developerApi } from '../../services/developerApi';
import { RoleProvider } from '../../lib/roleContext';

export default function DeveloperEventWizardPage(): React.ReactElement {
  return (
    <RoleProvider api={developerApi} basePath="/developer" role="developer">
      <EventWizardPage />
    </RoleProvider>
  );
}
