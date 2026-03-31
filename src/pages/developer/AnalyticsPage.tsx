import React from 'react';
import SharedAnalyticsPage from '../shared/AnalyticsPage';
import { developerApi } from '../../services/developerApi';
import { RoleProvider } from '../../lib/roleContext';

export default function DeveloperAnalyticsPageWrapper(): React.ReactElement {
  return (
    <RoleProvider api={developerApi} basePath="/developer" role="developer">
      <SharedAnalyticsPage />
    </RoleProvider>
  );
}
