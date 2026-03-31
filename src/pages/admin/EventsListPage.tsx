import React from 'react';
import EventsListPage from '../shared/EventsListPage';
import { adminApi } from '../../services/adminApi';
import { RoleProvider } from '../../lib/roleContext';

export default function AdminEventsListPage(): React.ReactElement {
  return (
    <RoleProvider api={adminApi} basePath="/admin" role="admin">
      <EventsListPage />
    </RoleProvider>
  );
}
