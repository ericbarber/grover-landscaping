import React from 'react';
import ReactDOM from 'react-dom/client';
import { sharedBidTokenFromPath } from './domain/sharedBidRoute';
import { sharedReportTokenFromPath } from './domain/sharedReportRoute';
import { organizationInvitationTokenFromPath } from './domain/organizationInvitationRoute';
import { AuthGate } from './auth/AuthGate';
import { AuthProvider } from './auth/AuthProvider';
import './styles.css';

const App = React.lazy(() => import('./App').then((module) => ({ default: module.App })));
const CustomerBidReviewPage = React.lazy(
  () => import('./components/CustomerBidReviewPage')
    .then((module) => ({ default: module.CustomerBidReviewPage })),
);
const CustomerCompletionReportPage = React.lazy(
  () => import('./components/CustomerCompletionReportPage')
    .then((module) => ({ default: module.CustomerCompletionReportPage })),
);
const OrganizationInvitationAcceptancePage = React.lazy(
  () => import('./components/OrganizationInvitationAcceptancePage')
    .then((module) => ({ default: module.OrganizationInvitationAcceptancePage })),
);

const sharedBidToken = sharedBidTokenFromPath(window.location.pathname);
const sharedReportToken = sharedReportTokenFromPath(window.location.pathname);
const organizationInvitationToken = organizationInvitationTokenFromPath(window.location.pathname);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <React.Suspense fallback={(
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <p className="text-sm font-semibold text-slate-700" role="status">
          Loading Grover Field…
        </p>
      </main>
    )}>
      {sharedBidToken ? (
        <CustomerBidReviewPage shareToken={sharedBidToken} />
      ) : sharedReportToken ? (
        <CustomerCompletionReportPage shareToken={sharedReportToken} />
      ) : (
        <AuthProvider>
          <AuthGate>
            {organizationInvitationToken ? (
              <OrganizationInvitationAcceptancePage token={organizationInvitationToken} />
            ) : (
              <App />
            )}
          </AuthGate>
        </AuthProvider>
      )}
    </React.Suspense>
  </React.StrictMode>,
);
