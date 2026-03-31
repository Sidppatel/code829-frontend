import React from 'react';
import GridEditor from '../../shared/editors/GridEditor';
import { developerApi } from '../../../services/developerApi';
import { RoleProvider } from '../../../lib/roleContext';

interface GridEditorProps {
  eventId: string;
}

export default function DeveloperGridEditor({ eventId }: GridEditorProps): React.ReactElement {
  return (
    <RoleProvider api={developerApi} basePath="/developer" role="developer">
      <GridEditor eventId={eventId} />
    </RoleProvider>
  );
}
