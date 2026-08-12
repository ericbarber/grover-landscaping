import React from 'react';
import { AuthGate } from './AuthGate';
import { AuthProvider } from './AuthProvider';
import { isOwnerAcquisitionPath } from '../domain/ownerAcquisitionRoute';

const App = React.lazy(() => import('../App').then((module) => ({ default: module.App })));
const OrganizationInvitationAcceptancePage = React.lazy(
  () => import('../components/OrganizationInvitationAcceptancePage')
    .then((module) => ({ default: module.OrganizationInvitationAcceptancePage })),
);
const YardOwnerAcquisitionPage = React.lazy(
  () => import('../components/YardOwnerAcquisitionPage')
    .then((module) => ({ default: module.YardOwnerAcquisitionPage })),
);

export function AuthenticatedExperience({
  organizationInvitationToken,
}: {
  organizationInvitationToken: string | null;
}) {
  const ownerAcquisition = isOwnerAcquisitionPath(window.location.pathname);
  return (
    <AuthProvider>
      <AuthGate>
        {organizationInvitationToken ? (
          <OrganizationInvitationAcceptancePage token={organizationInvitationToken} />
        ) : ownerAcquisition ? (
          <YardOwnerAcquisitionPage />
        ) : (
          <App />
        )}
      </AuthGate>
    </AuthProvider>
  );
}
