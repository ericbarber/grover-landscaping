import React from 'react';
import { AuthGate } from './AuthGate';
import { AuthProvider } from './AuthProvider';
import { isOwnerAcquisitionPath } from '../domain/ownerAcquisitionRoute';
import { isProviderInvitationPath } from '../domain/providerInvitationRoute';

const App = React.lazy(() => import('../App').then((module) => ({ default: module.App })));
const OrganizationInvitationAcceptancePage = React.lazy(
  () => import('../components/OrganizationInvitationAcceptancePage')
    .then((module) => ({ default: module.OrganizationInvitationAcceptancePage })),
);
const YardOwnerAcquisitionPage = React.lazy(
  () => import('../components/YardOwnerAcquisitionPage')
    .then((module) => ({ default: module.YardOwnerAcquisitionPage })),
);
const ProviderInvitationProgressPage = React.lazy(
  () => import('../components/ProviderInvitationProgressPage')
    .then((module) => ({ default: module.ProviderInvitationProgressPage })),
);

export function AuthenticatedExperience({
  organizationInvitationToken,
}: {
  organizationInvitationToken: string | null;
}) {
  const ownerAcquisition = isOwnerAcquisitionPath(window.location.pathname);
  const providerInvitation = isProviderInvitationPath(window.location.pathname);
  return (
    <AuthProvider>
      <AuthGate>
        {organizationInvitationToken ? (
          <OrganizationInvitationAcceptancePage token={organizationInvitationToken} />
        ) : ownerAcquisition ? (
          <YardOwnerAcquisitionPage />
        ) : providerInvitation ? (
          <ProviderInvitationProgressPage />
        ) : (
          <App />
        )}
      </AuthGate>
    </AuthProvider>
  );
}
