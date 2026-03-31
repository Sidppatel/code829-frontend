import React from 'react';
import PricingStep from '../../shared/editors/PricingStep';
import type { PricingStepProps } from '../../shared/editors/PricingStep';
import { developerApi } from '../../../services/developerApi';
import { RoleProvider } from '../../../lib/roleContext';

export type { PricingStepProps };

export default function DeveloperPricingStep(props: PricingStepProps): React.ReactElement {
  return (
    <RoleProvider api={developerApi} basePath="/developer" role="developer">
      <PricingStep {...props} />
    </RoleProvider>
  );
}
