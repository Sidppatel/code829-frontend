import React from 'react';
import EventManagePage from '../shared/EventManagePage';
import { developerApi } from '../../services/developerApi';
import { RoleProvider } from '../../lib/roleContext';

export default function DeveloperEventManagePage(): React.ReactElement {
  return (
    <RoleProvider api={developerApi} basePath="/developer" role="developer">
      <EventManagePage />
    </RoleProvider>
  );
}
