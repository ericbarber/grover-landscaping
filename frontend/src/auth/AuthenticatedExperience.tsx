import React from 'react';
import { AuthGate } from './AuthGate';
import { AuthProvider } from './AuthProvider';

const App = React.lazy(() => import('../App').then((module) => ({ default: module.App })));
const OrganizationInvitationAcceptancePage = React.lazy(
  () => import('../components/OrganizationInvitationAcceptancePage')
    .then((module) => ({ default: module.OrganizationInvitationAcceptancePage })),
);

export function AuthenticatedExperience({
  organizationInvitationToken,
}: {
  organizationInvitationToken: string | null;
}) {
  return (
    <AuthProvider>
      <AuthGate>
        {organizationInvitationToken ? (
          <OrganizationInvitationAcceptancePage token={organizationInvitationToken} />
        ) : (
          <App />
        )}
      </AuthGate>
    </AuthProvider>
  );
}
