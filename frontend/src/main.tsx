import React from 'react';
import ReactDOM from 'react-dom/client';
import { sharedBidTokenFromPath } from './domain/sharedBidRoute';
import { sharedReportTokenFromPath } from './domain/sharedReportRoute';
import { organizationInvitationTokenFromPath } from './domain/organizationInvitationRoute';
import { RouteLoadBoundary } from './components/RouteLoadBoundary';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { ApiStatusBanner } from './components/ApiStatusBanner';
import { registerProductionServiceWorker } from './registerServiceWorker';
import { ServiceWorkerUpdateBanner } from './components/ServiceWorkerUpdateBanner';
import { InstallAppBanner } from './components/InstallAppBanner';
import './styles.css';

registerProductionServiceWorker();

const CustomerBidReviewPage = React.lazy(
  () => import('./components/CustomerBidReviewPage')
    .then((module) => ({ default: module.CustomerBidReviewPage })),
);
const CustomerCompletionReportPage = React.lazy(
  () => import('./components/CustomerCompletionReportPage')
    .then((module) => ({ default: module.CustomerCompletionReportPage })),
);
const AuthenticatedExperience = React.lazy(
  () => import('./auth/AuthenticatedExperience')
    .then((module) => ({ default: module.AuthenticatedExperience })),
);

const sharedBidToken = sharedBidTokenFromPath(window.location.pathname);
const sharedReportToken = sharedReportTokenFromPath(window.location.pathname);
const organizationInvitationToken = organizationInvitationTokenFromPath(window.location.pathname);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <NetworkStatusBanner />
    <ApiStatusBanner />
    <ServiceWorkerUpdateBanner />
    <InstallAppBanner />
    <RouteLoadBoundary>
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
          <AuthenticatedExperience organizationInvitationToken={organizationInvitationToken} />
        )}
      </React.Suspense>
    </RouteLoadBoundary>
  </React.StrictMode>,
);
