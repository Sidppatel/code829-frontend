import React from 'react';
import EventsListPage from '../shared/EventsListPage';
import { developerApi } from '../../services/developerApi';
import { RoleProvider } from '../../lib/roleContext';

export default function DeveloperEventsListPage(): React.ReactElement {
  return (
    <RoleProvider api={developerApi} basePath="/developer" role="developer">
      <EventsListPage />
    </RoleProvider>
  );
}
