import React from 'react';
import SharedAnalyticsPage from '../shared/AnalyticsPage';
import { adminApi } from '../../services/adminApi';
import { RoleProvider } from '../../lib/roleContext';

export default function AdminAnalyticsPageWrapper(): React.ReactElement {
  return (
    <RoleProvider api={adminApi} basePath="/admin" role="admin">
      <SharedAnalyticsPage />
    </RoleProvider>
  );
}
