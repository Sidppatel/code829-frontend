import React from 'react';
import ReviewStep from '../../shared/editors/ReviewStep';
import type { ReviewStepProps } from '../../shared/editors/ReviewStep';
import { developerApi } from '../../../services/developerApi';
import { RoleProvider } from '../../../lib/roleContext';

export type { ReviewStepProps };

export default function DeveloperReviewStep(props: ReviewStepProps): React.ReactElement {
  return (
    <RoleProvider api={developerApi} basePath="/developer" role="developer">
      <ReviewStep {...props} />
    </RoleProvider>
  );
}
