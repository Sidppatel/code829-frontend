import React from 'react';
import GridEditor from '../../shared/editors/GridEditor';
import { adminApi } from '../../../services/adminApi';
import { RoleProvider } from '../../../lib/roleContext';

interface GridEditorProps {
  eventId: string;
}

export default function AdminGridEditor({ eventId }: GridEditorProps): React.ReactElement {
  return (
    <RoleProvider api={adminApi} basePath="/admin" role="admin">
      <GridEditor eventId={eventId} />
    </RoleProvider>
  );
}
