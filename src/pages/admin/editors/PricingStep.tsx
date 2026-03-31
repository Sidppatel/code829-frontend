import React from 'react';
import PricingStep from '../../shared/editors/PricingStep';
import type { PricingStepProps } from '../../shared/editors/PricingStep';
import { adminApi } from '../../../services/adminApi';
import { RoleProvider } from '../../../lib/roleContext';

export type { PricingStepProps };

export default function AdminPricingStep(props: PricingStepProps): React.ReactElement {
  return (
    <RoleProvider api={adminApi} basePath="/admin" role="admin">
      <PricingStep {...props} />
    </RoleProvider>
  );
}
