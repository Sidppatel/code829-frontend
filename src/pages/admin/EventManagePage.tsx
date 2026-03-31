import React from 'react';
import EventManagePage from '../shared/EventManagePage';
import { adminApi } from '../../services/adminApi';
import { RoleProvider } from '../../lib/roleContext';

export default function AdminEventManagePage(): React.ReactElement {
  return (
    <RoleProvider api={adminApi} basePath="/admin" role="admin">
      <EventManagePage />
    </RoleProvider>
  );
}
