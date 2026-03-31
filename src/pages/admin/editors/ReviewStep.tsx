import React from 'react';
import ReviewStep from '../../shared/editors/ReviewStep';
import type { ReviewStepProps } from '../../shared/editors/ReviewStep';
import { adminApi } from '../../../services/adminApi';
import { RoleProvider } from '../../../lib/roleContext';

export type { ReviewStepProps };

export default function AdminReviewStep(props: ReviewStepProps): React.ReactElement {
  return (
    <RoleProvider api={adminApi} basePath="/admin" role="admin">
      <ReviewStep {...props} />
    </RoleProvider>
  );
}
